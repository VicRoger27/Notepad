#!/usr/bin/env bash
# Cross Notepad - Desktop Shortcut Creator for Linux

set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
ROOT_DIR="$( dirname "$DIR" )"

# Detect desktop folder
DESKTOP_DIR="${HOME}/Desktop"
if command -v xdg-user-dir >/dev/null 2>&1; then
    DESKTOP_DIR="$(xdg-user-dir DESKTOP)"
fi

mkdir -p "$DESKTOP_DIR"
SHORTCUT_PATH="$DESKTOP_DIR/Cross Notepad.desktop"
APP_EXEC="$DIR/notepad.sh"
APP_ICON="$DIR/icon.png"

cat <<EOF > "$SHORTCUT_PATH"
[Desktop Entry]
Version=1.0
Type=Application
Name=Cross Notepad
Comment=Simple, modern Text & Markdown Notepad with Gemma AI
Exec=$APP_EXEC %F
Icon=$APP_ICON
Terminal=false
Categories=Utility;TextEditor;Development;
StartupNotify=true
MimeType=text/plain;text/markdown;
EOF

chmod +x "$SHORTCUT_PATH"

# Trust shortcut on GNOME/KDE if gio is present
if command -v gio >/dev/null 2>&1; then
    gio set "$SHORTCUT_PATH" metadata::trusted true 2>/dev/null || true
fi

echo "=================================================="
echo "✓ Desktop shortcut successfully created!"
echo "Location: $SHORTCUT_PATH"
echo "=================================================="

if command -v notify-send >/dev/null 2>&1; then
    notify-send "Cross Notepad" "Desktop shortcut created successfully!" -i "$APP_ICON"
fi
