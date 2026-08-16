#!/usr/bin/env bash
# Cross Notepad Linux Installer with LLM Option Prompt

set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
ROOT_DIR="$( dirname "$DIR" )"

echo "=================================================="
echo "          Cross Notepad Linux Installer           "
echo "=================================================="
echo ""

INSTALL_DIR="${HOME}/.local/share/CrossNotepad"
mkdir -p "$INSTALL_DIR"

echo "1. Installing core files, vector icons & themes to $INSTALL_DIR..."
cp -r "$ROOT_DIR/app" "$INSTALL_DIR/"
cp -r "$DIR" "$INSTALL_DIR/Linux"
cp "$ROOT_DIR/README.md" "$INSTALL_DIR/"

echo ""
echo "--------------------------------------------------"
echo "Optional Local AI Integration (Gemma-4)"
echo "--------------------------------------------------"
read -p "Would you like to install and configure local Gemma-4 AI (gemma4-e2b-it)? [Y/n]: " INSTALL_LLM
INSTALL_LLM=${INSTALL_LLM:-Y}

mkdir -p "$INSTALL_DIR/config"

if [[ "$INSTALL_LLM" =~ ^[Yy]$ ]]; then
    echo ""
    read -p "Enter path to Gemma model folder (Press Enter for default: C:/Users/kosti/AI Models/gemma4-e2b-it): " MODEL_PATH
    MODEL_PATH=${MODEL_PATH:-"C:/Users/kosti/AI Models/gemma4-e2b-it"}

    cat <<EOF > "$INSTALL_DIR/config/ai_config.json"
{
  "enabled": true,
  "model_name": "gemma4-e2b-it",
  "model_path": "$MODEL_PATH",
  "auto_start_service": true,
  "port": 4141
}
EOF
    echo "Configured local Gemma-4 AI at: $MODEL_PATH"
else
    cat <<EOF > "$INSTALL_DIR/config/ai_config.json"
{
  "enabled": false,
  "model_name": "gemma4-e2b-it",
  "model_path": "",
  "auto_start_service": false,
  "port": 4141
}
EOF
    echo "Configured standard lightweight mode (no local LLM)"
fi

echo ""
echo "2. Creating desktop launcher and application menu shortcut..."
DESKTOP_ENTRY="${HOME}/.local/share/applications/cross-notepad.desktop"
mkdir -p "${HOME}/.local/share/applications"

cat <<EOF > "$DESKTOP_ENTRY"
[Desktop Entry]
Name=Cross Notepad
Comment=Simple, modern Text & Markdown Notepad with Gemma AI
Exec=$INSTALL_DIR/Linux/notepad.sh %F
Icon=$INSTALL_DIR/Linux/icon.png
Terminal=false
Type=Application
Categories=Utility;TextEditor;Development;
MimeType=text/plain;text/markdown;
EOF

chmod +x "$DESKTOP_ENTRY"
chmod +x "$INSTALL_DIR/Linux/notepad.sh"
chmod +x "$INSTALL_DIR/Linux/CrossNotepad.elf" 2>/dev/null || true

echo ""
echo "=================================================="
echo "Cross Notepad successfully installed!"
echo "You can launch it from your Applications menu or run:"
echo "  $INSTALL_DIR/Linux/notepad.sh"
echo "=================================================="
