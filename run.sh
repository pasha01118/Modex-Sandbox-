#!/usr/bin/env bash
set -euo pipefail

PORT="${1:-4173}"
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

info()  { echo -e "${CYAN}[INFO]${NC} $1"; }
ok()    { echo -e "${GREEN}[OK]${NC}   $1"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
err()   { echo -e "${RED}[ERR]${NC}  $1"; }

detect_termux() {
  [[ -d /data/data/com.termux ]] || [[ "$(uname -o 2>/dev/null)" == "Android" ]] || [[ -n "${TERMUX_VERSION:-}" ]]
}

# Parse --ollama flag
INSTALL_OLLAMA=${INSTALL_OLLAMA:-}
for arg in "$@"; do
  if [[ "$arg" == "--ollama" ]]; then INSTALL_OLLAMA=1; fi
  if [[ "$arg" =~ ^--port= ]]; then PORT="${arg#*=}"; fi
done

echo "========================================="
echo "  MODEX — Autonomous AI Web UI"
echo "========================================="
echo ""

# ── 1. Install pnpm ──────────────────────────────
info "Checking pnpm..."
if command -v pnpm &>/dev/null; then
  PNPM_VER=$(pnpm --version 2>/dev/null)
  ok "pnpm v$PNPM_VER already installed"
else
  echo "[1/4] Installing pnpm..."
  if detect_termux; then
    npm install -g pnpm 2>/dev/null || {
      corepack enable 2>/dev/null && corepack prepare pnpm@latest --activate 2>/dev/null || {
        curl -fsSL https://get.pnpm.io/install.sh | sh -
        export PNPM_HOME="$HOME/.local/share/pnpm"
        export PATH="$PNPM_HOME:$PATH"
      }
    }
  else
    npm install -g pnpm 2>/dev/null || {
      curl -fsSL https://get.pnpm.io/install.sh | sh -
      export PNPM_HOME="$HOME/.local/share/pnpm"
      export PATH="$PNPM_HOME:$PATH"
    }
  fi
  if command -v pnpm &>/dev/null; then
    ok "pnpm v$(pnpm --version) installed"
  else
    err "pnpm installation failed. Try: npm install -g pnpm"
    exit 1
  fi
fi

# ── 2. Install dependencies ──────────────────────
if [ ! -d node_modules ]; then
  echo "[2/4] Installing dependencies..."
  pnpm install
  ok "Dependencies installed"
else
  info "Dependencies already installed"
fi

# ── 3. Optional: Setup Ollama ────────────────────
if ! command -v ollama &>/dev/null; then
  if [[ -n "$INSTALL_OLLAMA" ]]; then
    echo "[3/4] Installing Ollama..."
    if detect_termux; then
      bash scripts/install-ollama-termux.sh
    else
      curl -fsSL https://ollama.com/install.sh | sh
    fi
  else
    info "Ollama not installed. For local AI models run:"
    info "  bash scripts/install-ollama-termux.sh    (Termux)"
    info "  curl -fsSL https://ollama.com/install.sh | sh  (Linux)"
  fi
fi

# ── Ensure Ollama is running ────────────────────
if command -v ollama &>/dev/null; then
  if ! pgrep -x ollama >/dev/null 2>&1; then
    info "Starting ollama server..."
    ollama serve &>/dev/null &
    sleep 2
    if pgrep -x ollama >/dev/null 2>&1; then
      ok "Ollama server started"
    else
      warn "Could not start ollama — run: ollama serve"
    fi
  else
    ok "Ollama server already running"
  fi
fi

# ── 4. Build ──────────────────────────────────────
if [ ! -f dist-cli/index.js ]; then
  echo "[3/4] Building app..."
  pnpm run build
  ok "Build complete"
else
  info "Already built"
fi

# ── 5. Start ──────────────────────────────────────
echo ""
echo "[4/4] Starting server on port $PORT..."
echo ""
echo -e "  ${CYAN}http://127.0.0.1:${PORT}/${NC}"
echo ""

exec node dist-cli/index.js --port "$PORT" --no-open --no-tunnel --no-login --no-password
