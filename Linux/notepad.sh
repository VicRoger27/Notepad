#!/usr/bin/env bash
# Cross Notepad Linux Launcher (Clean Modern UI)

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

if [ -d "$DIR/../app/node_modules/electron" ]; then
    cd "$DIR/../app" && npx electron . "$@"
elif [ -f "$DIR/CrossNotepad-1.0.0.AppImage" ]; then
    chmod +x "$DIR/CrossNotepad-1.0.0.AppImage"
    "$DIR/CrossNotepad-1.0.0.AppImage" "$@"
elif [ -f "$DIR/CrossNotepad.elf" ]; then
    chmod +x "$DIR/CrossNotepad.elf"
    "$DIR/CrossNotepad.elf" "$@"
elif [ -f "$DIR/../app/notepad.py" ]; then
    python3 "$DIR/../app/notepad.py" "$@"
else
    echo "Starting Cross Notepad..."
fi
