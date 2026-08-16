#!/usr/bin/env bash
# Cross Notepad - Wipe & Clean Reinstall Script for Linux

set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
ROOT_DIR="$( dirname "$DIR" )"

echo "=================================================="
echo "    Cross Notepad - Wipe & Clean Reinstaller     "
echo "=================================================="

# 1. Run Uninstaller / Purge
if [ -f "$DIR/uninstall.sh" ]; then
    bash "$DIR/uninstall.sh"
fi

# 2. Run Fresh Installer
if [ -f "$DIR/install.sh" ]; then
    echo "Starting clean reinstallation..."
    bash "$DIR/install.sh"
fi

echo "=================================================="
echo "✓ Factory reset & clean reinstall complete!"
echo "=================================================="
