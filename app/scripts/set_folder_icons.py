#!/usr/bin/env python3
"""
Sets custom native folder icons for Windows and Linux folders.
Generates multi-resolution .ico files, desktop.ini, .directory configs,
and sets the proper Windows shell attributes + triggers shell refresh.
"""

import os
import sys
import ctypes
from PIL import Image

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
WINDOWS_DIR = os.path.join(ROOT_DIR, "Windows")
LINUX_DIR = os.path.join(ROOT_DIR, "Linux")

def create_ico_and_png(jpg_path, out_ico, out_png):
    img = Image.open(jpg_path).convert("RGBA")
    # Save high-res png
    img.save(out_png, "PNG")
    
    # Save multi-size icon
    icon_sizes = [(256, 256), (128, 128), (64, 64), (48, 48), (32, 32), (16, 16)]
    img.save(out_ico, format="ICO", sizes=icon_sizes)
    print(f"Created: {out_ico} and {out_png}")

def setup_windows_folder_icon(folder_path, ico_filename="icon.ico"):
    desktop_ini_path = os.path.join(folder_path, "desktop.ini")
    
    # Reset attributes first if exists
    if os.path.exists(desktop_ini_path):
        os.system(f'attrib -h -s -r "{desktop_ini_path}" >nul 2>&1')

    desktop_ini_content = (
        "[.ShellClassInfo]\n"
        f"IconResource={ico_filename},0\n"
        "[ViewState]\n"
        "Mode=\n"
        "Vid=\n"
        "FolderType=Generic\n"
    )

    with open(desktop_ini_path, "w", encoding="utf-8") as f:
        f.write(desktop_ini_content)

    # Set attributes required by Windows Explorer:
    # 1. desktop.ini must be Hidden and System
    os.system(f'attrib +h +s "{desktop_ini_path}"')
    # 2. Folder itself MUST have Read-Only attribute (+r) or System (+s) for Explorer to parse desktop.ini
    os.system(f'attrib +r "{folder_path}"')
    print(f"Configured desktop.ini for {folder_path}")

def setup_linux_folder_icon(folder_path, png_filename="icon.png"):
    dot_directory_path = os.path.join(folder_path, ".directory")
    dot_directory_content = (
        "[Desktop Entry]\n"
        f"Icon=./{png_filename}\n"
        "Type=Directory\n"
    )
    with open(dot_directory_path, "w", encoding="utf-8") as f:
        f.write(dot_directory_content)
    print(f"Configured .directory for {folder_path}")

def refresh_windows_shell():
    try:
        # SHCNE_ASSOCCHANGED = 0x08000000, SHCNF_IDLIST = 0
        ctypes.windll.shell32.SHChangeNotify(0x08000000, 0, None, None)
        print("Notified Windows Shell to refresh folder icons!")
    except Exception as e:
        print(f"Shell refresh notice: {e}")

def main():
    # 1. Windows Folder
    win_jpg = os.path.join(WINDOWS_DIR, "windows_logo.jpg")
    win_ico = os.path.join(WINDOWS_DIR, "icon.ico")
    win_png = os.path.join(WINDOWS_DIR, "icon.png")
    if os.path.exists(win_jpg):
        create_ico_and_png(win_jpg, win_ico, win_png)
        setup_windows_folder_icon(WINDOWS_DIR, "icon.ico")

    # 2. Linux Folder
    linux_jpg = os.path.join(LINUX_DIR, "linux_logo.jpg")
    linux_ico = os.path.join(LINUX_DIR, "icon.ico")
    linux_png = os.path.join(LINUX_DIR, "icon.png")
    if os.path.exists(linux_jpg):
        create_ico_and_png(linux_jpg, linux_ico, linux_png)
        # Windows Explorer viewing of Linux folder
        setup_windows_folder_icon(LINUX_DIR, "icon.ico")
        # Linux file manager viewing of Linux folder
        setup_linux_folder_icon(LINUX_DIR, "icon.png")

    # 3. Refresh Explorer cache
    refresh_windows_shell()
    print("Folder icons successfully configured for Windows and Linux folders!")

if __name__ == "__main__":
    main()
