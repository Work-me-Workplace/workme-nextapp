#!/usr/bin/env bash
set -euo pipefail

echo "--- amplify-debug: environment ---"
env | sort

echo "--- amplify-debug: pwd ---"
pwd

echo "--- amplify-debug: current dir listing ---"
ls -la

echo "--- amplify-debug: repo root listing (../) ---"
ls -la .. || true

if [ -f package.json ]; then
  echo "--- amplify-debug: package.json found ---"
  echo "package.json contents:"
  cat package.json
else
  echo "--- amplify-debug: package.json NOT found ---"
fi

echo "--- amplify-debug: tree (depth 2) ---"
if command -v tree >/dev/null 2>&1; then
  tree -L 2 || true
else
  find . -maxdepth 2 -print | sed 's|[^/]*/|  |g'
fi

echo "--- end amplify-debug ---"