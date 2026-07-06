#!/usr/bin/env bash
set -euo pipefail

PORT="${1:-4173}"
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

echo "========================================="
echo "  Codex UI - One Click Local Deploy"
echo "========================================="

# 1. Install pnpm if missing
if ! command -v pnpm &>/dev/null; then
  echo "[1/4] Installing pnpm..."
  npm install -g pnpm &>/dev/null
fi

# 2. Install deps
if [ ! -d node_modules ]; then
  echo "[2/4] Installing dependencies..."
  pnpm install
fi

# 3. Build
if [ ! -f dist-cli/index.js ]; then
  echo "[3/4] Building app..."
  pnpm run build
fi

# 4. Start
echo "[4/4] Starting server on port $PORT..."
echo ""
echo "  http://127.0.0.1:$PORT/"
echo ""

exec node dist-cli/index.js --port "$PORT" --no-open --no-tunnel --no-login --no-password
