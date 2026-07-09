#!/usr/bin/env bash
set -euo pipefail

# Builds LikeC4 webcomponent bundles for all docs sections that contain
# ```likec4 fences in their markdown files.
# Output: assets/js/<section>-components.js per section.
# Usage (from Poort8.Docs root):
#   ./build-likec4.sh

repo_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$repo_dir"

mkdir -p assets/js
sections_built=0

# Discover every top-level directory that contains a likec4 fence in a markdown file.
# To add a new docs section with diagrams: just add ```likec4 fences — no changes here needed.
for section_dir in */; do
  section="${section_dir%/}"
  [ -d "$section_dir" ] || continue

  if ! grep -rl '```likec4' --include='*.md' --exclude='_*' --exclude-dir='_*' "$section_dir" 2>/dev/null | grep -q .; then
    continue
  fi

  likec4_dir="${section_dir%/}/likec4"

  rm -rf "$likec4_dir"
  mkdir -p "$likec4_dir"
  # Shared LikeC4 element kinds used by all diagrams; strip only blocks that match this template.
  # Add additional shared element kinds here if the generated 000-spec.c4 should expose more types.
  shared_spec=$'specification {\n  element actor\n  element system\n}'
  shared_spec_path="$likec4_dir/000-spec.c4"
  cat > "$shared_spec_path" <<EOF
$shared_spec
EOF

  # Extract each markdown file's likec4 fence into a .c4 source file.
  # The markdown is the single source of truth; .c4 files are generated.
  # Scans recursively; nested paths are flattened with '-' to avoid collisions.
  while IFS= read -r md_file; do
    rel="${md_file#"$section_dir"}"
    flat="${rel%.md}"
    flat="${flat//\//-}"
    python3 - "$md_file" "$likec4_dir/${flat}" "$shared_spec_path" <<'PY'
import os, sys, re
content = open(sys.argv[1], encoding='utf-8').read()
matches = re.findall(r'\x60\x60\x60likec4[^\n]*\n(.*?)\n\x60\x60\x60', content, re.DOTALL)
base = sys.argv[2]
shared_spec_path = sys.argv[3]
shared_spec = open(shared_spec_path, encoding='utf-8').read()


def normalize_spec(spec):
    """Return a whitespace-normalized version of a LikeC4 specification block.

    This strips indentation and surrounding whitespace from each line so
    specification blocks with different layout can still be compared reliably.
    """
    return '\n'.join(line.strip() for line in spec.strip().splitlines())

shared_text = normalize_spec(shared_spec)
shared_element_kinds = [
    match.group(1) for match in re.finditer(r'(?m)^\s*element\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*$', shared_spec)
]
if not shared_element_kinds:
    raise ValueError('No shared LikeC4 element kinds found in shared spec. Expected format: element <kind_name>')
kind_name_re = re.compile(r'^[a-zA-Z_][a-zA-Z0-9_]*$')
for kind in shared_element_kinds:
    if not kind_name_re.match(kind):
        raise ValueError(f'Invalid shared LikeC4 element kind: {kind}')
shared_kind_pattern = '|'.join(re.escape(kind) for kind in shared_element_kinds)
element_kind_pattern = r'(?:' + shared_kind_pattern + r')'
marker_re = re.compile(r'(?m)^\s*//\s*likec4:shared-spec\s*$')
spec_re = re.compile(r'(?ms)^\s*specification\s*\{.*?^\s*\}\s*')
for i, m in enumerate(matches):
    fname = base + ('.c4' if len(matches) == 1 else '-' + str(i) + '.c4')
    # Sanitize the generated filename so it can be used as a LikeC4 identifier prefix.
    stem = os.path.splitext(os.path.basename(fname))[0]
    prefix = re.sub(r'[^a-zA-Z0-9_]+', '_', stem).strip('_')
    if not prefix:
        prefix = 'diagram'
    elif not re.match(r'[a-zA-Z_]', prefix):
        prefix = 'diagram_' + prefix
    source = m
    match = spec_re.search(source)
    if match:
        block_text = normalize_spec(match.group(0))
        if block_text == shared_text or marker_re.search(match.group(0)):
            source = source[:match.start()] + source[match.end():]
    ids = re.findall(r'(?m)^\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*' + element_kind_pattern + r'\b', source)
    # Match single and double-quoted strings so identifier replacements skip string contents.
    string_re = re.compile(r"('(?:\\.|[^'\\])*'|\"(?:\\.|[^\"\\])*\")")
    parts = string_re.split(source)
    # Process longer identifiers first so substring replacements do not alter the longer names.
    for element_id in sorted(set(ids), key=len, reverse=True):
        id_re = re.compile(r'(?<![a-zA-Z0-9_])' + re.escape(element_id) + r'(?![a-zA-Z0-9_])')
        parts = [
            part if i % 2 else id_re.sub(prefix + '_' + element_id, part)
            for i, part in enumerate(parts)
        ]
    source = ''.join(parts)
    open(fname, 'w', encoding='utf-8').write(source.strip() + '\n')
PY
  done < <(find "$section_dir" -name '*.md' -not -path '*/_*' | sort)

  ls "$likec4_dir/"*.c4 > /dev/null 2>&1 \
    || { echo "ERROR: no .c4 files extracted for section '$section'" >&2; exit 1; }

  npx --yes likec4@1.56.0 codegen webcomponent \
    --outfile "assets/js/${section}-components.js" \
    "$likec4_dir"

  # Verify each extracted view-id is present in the generated bundle
  for c4_file in "$likec4_dir/"*.c4; do
    (grep -oE 'view [a-zA-Z0-9_]+' "$c4_file" || true) | awk '{print $2}' | while read -r view_id; do
      grep -q "$view_id" "assets/js/${section}-components.js" \
        || { echo "ERROR: view '$view_id' not found in bundle" >&2; exit 1; }
    done
  done

  sections_built=$((sections_built + 1))
done

echo "Built LikeC4 bundles for $sections_built section(s)."
