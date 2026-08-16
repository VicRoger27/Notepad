#!/usr/bin/env python3
"""
Robust launcher for Cross Notepad Windows standalone executable.
Detects correct directory from frozen sys.executable, launches Electron or Python GUI seamlessly without crashing.
"""

import os
import sys
import subprocess

def get_base_dir():
    if getattr(sys, 'frozen', False):
        return os.path.dirname(os.path.abspath(sys.executable))
    return os.path.dirname(os.path.abspath(__file__))

def main():
    try:
        base_dir = get_base_dir()
        if os.path.basename(base_dir).lower() == 'windows':
            root_dir = os.path.dirname(base_dir)
        else:
            root_dir = base_dir

        app_dir = os.path.join(root_dir, 'app')
        branded_electron = os.path.join(app_dir, 'node_modules', 'electron', 'dist', 'CrossNotepad.exe')
        unpacked_exe = os.path.join(app_dir, 'dist', 'win-unpacked', 'CrossNotepad.exe')
        electron_local = os.path.join(app_dir, 'node_modules', '.bin', 'electron.cmd')
        notepad_py = os.path.join(app_dir, 'notepad.py')

        args = sys.argv[1:]

        # 1. Prioritize branded CrossNotepad.exe binary (100% self-contained individual app)
        if os.path.isfile(branded_electron):
            subprocess.Popen([branded_electron] + args, cwd=os.path.dirname(branded_electron), creationflags=0x08000000 if sys.platform == 'win32' else 0)
            return

        # 2. Try unpacked electron build
        if os.path.isfile(unpacked_exe):
            subprocess.Popen([unpacked_exe] + args, creationflags=0x08000000 if sys.platform == 'win32' else 0)
            return

        # 3. Try local electron binary with live app sources
        if os.path.isfile(electron_local):
            subprocess.Popen([electron_local, '.'] + args, cwd=app_dir, shell=True, creationflags=0x08000000 if sys.platform == 'win32' else 0)
            return

        # 4. Universal Fallback: Python Tkinter GUI
        if os.path.isfile(notepad_py):
            subprocess.Popen([sys.executable, notepad_py] + args, cwd=app_dir, creationflags=0x08000000 if sys.platform == 'win32' else 0)
            return

    except Exception as err:
        import tkinter.messagebox as mb
        mb.showerror("Cross Notepad", f"Failed to start Notepad:\n{err}")

if __name__ == '__main__':
    main()
