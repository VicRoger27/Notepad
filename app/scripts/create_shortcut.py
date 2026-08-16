#!/usr/bin/env python3
"""
Cross Notepad - Desktop Shortcut Creator (Windows)
Resolves actual Windows Shell desktop paths (including OneDrive/Cloud sync)
and creates the desktop shortcut with high-resolution icon.
"""

import os
import sys
import ctypes
from ctypes import wintypes
import subprocess
import tkinter as tk
from tkinter import messagebox

def get_base_dir():
    if getattr(sys, 'frozen', False):
        return os.path.dirname(os.path.abspath(sys.executable))
    return os.path.dirname(os.path.abspath(__file__))

def get_real_desktop_paths():
    paths = set()

    # 1. Windows API CSIDL_DESKTOPDIRECTORY (0x0010)
    try:
        buf = ctypes.create_unicode_buffer(wintypes.MAX_PATH)
        ctypes.windll.shell32.SHGetFolderPathW(None, 0x0010, None, 0, buf)
        if buf.value and os.path.exists(buf.value):
            paths.add(buf.value)
    except Exception:
        pass

    # 2. PowerShell [Environment]::GetFolderPath('Desktop')
    try:
        res = subprocess.run(
            ["powershell", "-NoProfile", "-NonInteractive", "-Command", "[Environment]::GetFolderPath('Desktop')"],
            capture_output=True,
            text=True
        )
        ps_path = res.stdout.strip()
        if ps_path and os.path.exists(ps_path):
            paths.add(ps_path)
    except Exception:
        pass

    # 3. Environment Fallbacks
    user_prof = os.environ.get('USERPROFILE', os.path.expanduser('~'))
    if user_prof:
        p1 = os.path.join(user_prof, 'Desktop')
        if os.path.exists(p1):
            paths.add(p1)
        p2 = os.path.join(user_prof, 'OneDrive', 'Desktop')
        if os.path.exists(p2):
            paths.add(p2)

    return list(paths)

def create_windows_desktop_shortcut():
    base_dir = get_base_dir()
    
    # Resolve target exe
    if os.path.basename(base_dir).lower() == 'windows':
        win_dir = base_dir
        root_dir = os.path.dirname(base_dir)
    else:
        root_dir = base_dir
        win_dir = os.path.join(base_dir, 'Windows')

    target_exe = os.path.join(win_dir, 'CrossNotepad.exe')
    target_ico = os.path.join(win_dir, 'icon.ico')

    if not os.path.exists(target_exe):
        target_exe = os.path.join(base_dir, 'CrossNotepad.exe')
        target_ico = os.path.join(base_dir, 'icon.ico')

    desktop_paths = get_real_desktop_paths()
    if not desktop_paths:
        desktop_paths = [os.path.join(os.environ.get('USERPROFILE', ''), 'Desktop')]

    created_locations = []

    for d_path in desktop_paths:
        shortcut_file = os.path.join(d_path, 'Cross Notepad.lnk')
        try:
            ps_script = f'''
            $WshShell = New-Object -comObject WScript.Shell
            $Shortcut = $WshShell.CreateShortcut("{shortcut_file}")
            $Shortcut.TargetPath = "{target_exe}"
            $Shortcut.WorkingDirectory = "{win_dir}"
            $Shortcut.Description = "Cross Notepad - Fast Text & Markdown Editor with Gemma AI"
            if (Test-Path "{target_ico}") {{
                $Shortcut.IconLocation = "{target_ico},0"
            }}
            $Shortcut.Save()
            '''
            subprocess.run(["powershell", "-NoProfile", "-NonInteractive", "-Command", ps_script], capture_output=True, check=True)
            created_locations.append(shortcut_file)
        except Exception as e:
            print(f"Notice on {shortcut_file}: {e}")

    # Refresh Windows Shell
    try:
        ctypes.windll.shell32.SHChangeNotify(0x08000000, 0, None, None)
    except Exception:
        pass

    root = tk.Tk()
    root.withdraw()

    if created_locations:
        loc_str = "\n".join(created_locations)
        messagebox.showinfo("Desktop Shortcut Created", f"Successfully created desktop shortcut for Cross Notepad!\n\nLocation:\n{loc_str}")
    else:
        messagebox.showerror("Error Creating Shortcut", "Could not write shortcut to the desktop folder.")

    root.destroy()

if __name__ == '__main__':
    create_windows_desktop_shortcut()
