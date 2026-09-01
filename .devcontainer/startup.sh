#!/usr/bin/env bash
set -euo pipefail

repo_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_dir"

npm install --global docsify-cli@5.0.0 markdown-link-check@3.15.0
bash build-likec4.sh
node --test tests/docsify-v5.test.mjs
