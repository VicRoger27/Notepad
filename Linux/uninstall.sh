#!/usr/bin/env bash
# Cross Notepad - Complete Linux Uninstaller

set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
ROOT_DIR="$( dirname "$DIR" )"

echo "=================================================="
echo "          Cross Notepad - Uninstaller             "
echo "=================================================="

# Detect desktop folder
DESKTOP_DIR="${HOME}/Desktop"
if command -v xdg-user-dir >/dev/null 2>&1; then
    DESKTOP_DIR="$(xdg-user-dir DESKTOP)"
fi

# 1. Remove Desktop Shortcut
if [ -f "$DESKTOP_DIR/Cross Notepad.desktop" ]; then
    rm -f "$DESKTOP_DIR/Cross Notepad.desktop"
    echo "✓ Removed Desktop shortcut."
fi

# 2. Remove User Applications Menu entry
if [ -f "${HOME}/.local/share/applications/cross-notepad.desktop" ]; then
    rm -f "${HOME}/.local/share/applications/cross-notepad.desktop"
    echo "✓ Removed Applications Menu entry."
fi

# 3. Clean installation directory in ~/.local/share/cross-notepad if present
if [ -d "${HOME}/.local/share/cross-notepad" ]; then
    rm -rf "${HOME}/.local/share/cross-notepad"
    echo "✓ Cleaned application files in ~/.local/share/cross-notepad."
fi

# 4. Clean config directory in ~/.config/cross-notepad
if [ -d "${HOME}/.config/cross-notepad" ]; then
    rm -rf "${HOME}/.config/cross-notepad"
    echo "✓ Cleaned configuration cache."
fi

# Update desktop database
if command -v update-desktop-database >/dev/null 2>&1; then
    update-desktop-database "${HOME}/.local/share/applications" 2>/dev/null || true
fi

echo "=================================================="
echo "✓ Cross Notepad successfully uninstalled!"
echo "=================================================="
