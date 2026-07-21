#!/usr/bin/env bash
set -euo pipefail

PORT="${1:-4173}"
HOST="${2:-127.0.0.1}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

cd "$SCRIPT_DIR"

# Auto-install pnpm if missing
if ! command -v pnpm &>/dev/null; then
  echo "[SETUP] Installing pnpm..."
  npm install -g pnpm
fi

# Build if dist is missing
if [ ! -f dist-cli/index.js ]; then
  echo "[BUILD] Building app..."
  pnpm install
  pnpm run build
fi

# Start via Vite CLI directly (bypass dev.cjs which doesn't support --host)
echo ""
echo "  MODEX AI running at:  http://$HOST:$PORT/"
echo ""

exec node ./node_modules/vite/dist/node/cli.js --host "$HOST" --port "$PORT"
