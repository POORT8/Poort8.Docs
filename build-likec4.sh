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

  rm -rf "$section_dir/likec4"
  mkdir -p "$section_dir/likec4"
  cat > "${section_dir}likec4/000-spec.c4" <<'EOF'
specification {
  element actor
  element system
}
EOF

  # Extract each markdown file's likec4 fence into a .c4 source file.
  # The markdown is the single source of truth; .c4 files are generated.
  # Scans recursively; nested paths are flattened with '-' to avoid collisions.
  while IFS= read -r md_file; do
    rel="${md_file#"$section_dir"}"
    flat="${rel%.md}"
    flat="${flat//\//-}"
    python3 - "$md_file" "${section_dir}likec4/${flat}" <<'PY'
import os, sys, re
content = open(sys.argv[1], encoding='utf-8').read()
matches = re.findall(r'\x60\x60\x60likec4[^\n]*\n(.*?)\n\x60\x60\x60', content, re.DOTALL)
base = sys.argv[2]
for i, m in enumerate(matches):
    fname = base + ('.c4' if len(matches) == 1 else '-' + str(i) + '.c4')
    prefix = re.sub(r'[^a-zA-Z0-9_]+', '_', os.path.basename(fname)[:-3]).strip('_')
    if not re.match(r'[a-zA-Z_]', prefix):
        prefix = 'diagram_' + prefix
    source = re.sub(r'(?ms)^\s*specification\s*\{.*?^\s*\}\s*', '', m, count=1)
    ids = re.findall(r'(?m)^\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(?:actor|system)\b', source)
    string_re = re.compile(r'''('(?:\\.|[^'\\])*'|\"(?:\\.|[^\"\\])*\")''')
    parts = string_re.split(source)
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

  ls "${section_dir}likec4/"*.c4 > /dev/null 2>&1 \
    || { echo "ERROR: no .c4 files extracted for section '$section'" >&2; exit 1; }

  npx --yes likec4@1.56.0 codegen webcomponent \
    --outfile "assets/js/${section}-components.js" \
    "${section_dir}likec4"

  # Verify each extracted view-id is present in the generated bundle
  for c4_file in "${section_dir}likec4/"*.c4; do
    (grep -oE 'view [a-zA-Z0-9_]+' "$c4_file" || true) | awk '{print $2}' | while read -r view_id; do
      grep -q "$view_id" "assets/js/${section}-components.js" \
        || { echo "ERROR: view '$view_id' not found in bundle" >&2; exit 1; }
    done
  done

  sections_built=$((sections_built + 1))
done

echo "Built LikeC4 bundles for $sections_built section(s)."
