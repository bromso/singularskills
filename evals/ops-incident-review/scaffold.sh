#!/usr/bin/env bash
# Copy this case's fixtures into the run's workspace (the current directory).
set -euo pipefail
fixtures="$(cd "$(dirname "$0")" && pwd)/fixtures"
[ -d "$fixtures" ] || { echo "scaffold: $fixtures not found" >&2; exit 1; }
cp -R "$fixtures/." "$PWD/"
