#!/usr/bin/env bash
# install-ollama-termux.sh — Install Ollama on Android/Termux
# The official install.sh uses 'su' which doesn't work on Termux.
# This downloads the Linux arm64 binary and sets up a local install.
set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

info()  { echo -e "${CYAN}[INFO]${NC} $1"; }
ok()    { echo -e "${GREEN}[OK]${NC}   $1"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
err()   { echo -e "${RED}[ERR]${NC}  $1"; }

OLLAMA_DIR="$HOME/ollama"
OLLAMA_BIN="$OLLAMA_DIR/ollama"
ARCH=$(uname -m)

# Map architecture to download URL
case "$ARCH" in
  aarch64|arm64)  URL="https://ollama.com/download/ollama-linux-arm64" ;;
  x86_64|amd64)   URL="https://ollama.com/download/ollama-linux-amd64" ;;
  *)
    err "Unsupported architecture: $ARCH"
    err "Ollama supports: arm64 (aarch64), amd64 (x86_64)"
    exit 1
    ;;
esac

echo "========================================="
echo "  Ollama Installer for Termux"
echo "========================================="
echo ""

# ── 1. Install dependencies ───────────────────
info "Checking system dependencies..."
for cmd in curl tar; do
  if ! command -v "$cmd" &>/dev/null; then
    warn "$cmd not found, installing..."
    pkg install -y "$cmd" 2>/dev/null || {
      err "Failed to install $cmd. Try: pkg install $cmd"
      exit 1
    }
  fi
done
ok "System dependencies ready"

# ── 2. Create install directory ────────────────
mkdir -p "$OLLAMA_DIR"

# ── 3. Download Ollama binary ──────────────────
if [ ! -f "$OLLAMA_BIN" ]; then
  echo ""
  info "Downloading Ollama for $ARCH..."
  echo "  $URL"
  echo ""

  curl -fSL "$URL" -o "$OLLAMA_BIN" 2>&1

  if [ ! -f "$OLLAMA_BIN" ]; then
    err "Download failed. Check your internet connection."
    exit 1
  fi

  chmod +x "$OLLAMA_BIN"
  ok "Downloaded to $OLLAMA_BIN"
else
  info "Ollama binary already exists at $OLLAMA_BIN"
fi

# ── 4. Set up PATH ────────────────────────────
SHELL_RC="$HOME/.bashrc"
if [[ -f "$HOME/.zshrc" ]]; then SHELL_RC="$HOME/.zshrc"; fi
if [[ -f "$HOME/.bash_profile" ]]; then SHELL_RC="$HOME/.bash_profile"; fi

if ! grep -q "ollama" "$SHELL_RC" 2>/dev/null; then
  echo "" >> "$SHELL_RC"
  echo "# Ollama (installed by MODEX install-ollama-termux.sh)" >> "$SHELL_RC"
  echo "export PATH=\"$OLLAMA_DIR:\$PATH\"" >> "$SHELL_RC"
  ok "Added $OLLAMA_DIR to PATH in $SHELL_RC"
fi

# Also export for current session
export PATH="$OLLAMA_DIR:$PATH"

# ── 5. Verify ─────────────────────────────────
echo ""
if "$OLLAMA_BIN" --version &>/dev/null; then
  OLLAMA_VER=$("$OLLAMA_BIN" --version 2>/dev/null || echo "installed")
  ok "Ollama $OLLAMA_VER"
else
  err "Ollama binary doesn't work. Architecture mismatch?"
  file "$OLLAMA_BIN"
  exit 1
fi

# ── 6. Start server ───────────────────────────
echo ""
info "Starting Ollama server in background..."
"$OLLAMA_BIN" serve &>/dev/null &
sleep 3

if pgrep -x ollama >/dev/null 2>&1; then
  ok "Ollama server running on http://127.0.0.1:11434"
else
  warn "Ollama server failed to start. Run manually:"
  warn "  $OLLAMA_BIN serve"
fi

# ── 7. Pull a small default model ─────────────
echo ""
info "Pull a starter model? (llama3.2:1b is ~800MB) [y/N]: "
read -r PULL_MODEL
if [[ "$PULL_MODEL" =~ ^[Yy]$ ]]; then
  echo ""
  "$OLLAMA_BIN" pull llama3.2:1b
  ok "llama3.2:1b pulled"
  info "Test it:  $OLLAMA_BIN run llama3.2:1b"
fi

echo ""
echo "========================================="
echo "  Ollama installed to $OLLAMA_DIR"
echo "  Server:     http://127.0.0.1:11434"
echo "  CLI:        $OLLAMA_BIN"
echo "  Restart:    $OLLAMA_BIN serve"
echo "  Usage:      $OLLAMA_BIN pull llama3.2"
echo "              $OLLAMA_BIN run llama3.2"
echo "========================================="
echo ""
