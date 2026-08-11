#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if rg -n -i 'console\.(log|error|warn).*\b(private[_-]?key|api[_-]?key|x-api-key)\b|echo.*\b(private[_-]?key|api[_-]?key)\b' \
  "$ROOT_DIR/api-hello-world/src" \
  "$ROOT_DIR/agentic-hello-world/run.sh"; then
  echo "Secret-like values must not be logged by the Hello World examples." >&2
  exit 1
fi

echo "No secret logging patterns found."
