#!/usr/bin/env python3
"""
Cross Notepad - Uninstaller Tool
Safely terminates running processes, removes shortcuts from Desktop and Start Menu,
cleans cache and uninstalls all application files.
"""

import os
import sys
import shutil
import ctypes
from ctypes import wintypes
import subprocess
import tkinter as tk
from tkinter import ttk, messagebox

def get_base_dir():
    if getattr(sys, 'frozen', False):
        return os.path.dirname(os.path.abspath(sys.executable))
    return os.path.dirname(os.path.abspath(__file__))

def get_desktop_paths():
    paths = set()
    try:
        buf = ctypes.create_unicode_buffer(wintypes.MAX_PATH)
        ctypes.windll.shell32.SHGetFolderPathW(None, 0x0010, None, 0, buf)
        if buf.value and os.path.exists(buf.value):
            paths.add(buf.value)
    except Exception:
        pass

    user_prof = os.environ.get('USERPROFILE', os.path.expanduser('~'))
    if user_prof:
        for p in [os.path.join(user_prof, 'Desktop'), os.path.join(user_prof, 'OneDrive', 'Desktop')]:
            if os.path.exists(p):
                paths.add(p)
    return list(paths)

def kill_running_processes():
    try:
        subprocess.run(["taskkill", "/F", "/IM", "CrossNotepad.exe", "/T"], capture_output=True)
        subprocess.run(["taskkill", "/F", "/IM", "electron.exe", "/T"], capture_output=True)
    except Exception:
        pass

class UninstallerApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Cross Notepad Uninstaller")
        self.root.geometry("480x280")
        self.root.resizable(False, False)
        self.root.config(bg="#1e1e24")

        self.setup_ui()

    def setup_ui(self):
        # Header
        header = tk.Frame(self.root, bg="#18181c", height=60, padx=18, pady=12)
        header.pack(fill=tk.X)

        lbl_title = tk.Label(header, text="Uninstall Cross Notepad", font=("Segoe UI", 13, "bold"), fg="#ffffff", bg="#18181c")
        lbl_title.pack(anchor=tk.W)

        lbl_sub = tk.Label(header, text="Remove Cross Notepad shortcuts, cache, and installed components", font=("Segoe UI", 9), fg="#8e95a5", bg="#18181c")
        lbl_sub.pack(anchor=tk.W)

        # Body
        body = tk.Frame(self.root, bg="#1e1e24", padx=20, pady=16)
        body.pack(fill=tk.BOTH, expand=True)

        self.lbl_desc = tk.Label(body, text="Are you sure you want to completely uninstall Cross Notepad?\nThis will remove all shortcuts, cached data, and program files.", font=("Segoe UI", 9), fg="#e2e8f0", bg="#1e1e24", justify=tk.LEFT)
        self.lbl_desc.pack(anchor=tk.W, pady=(0, 12))

        self.status_lbl = tk.Label(body, text="Ready.", font=("Segoe UI", 8), fg="#8e95a5", bg="#1e1e24")
        self.status_lbl.pack(anchor=tk.W, pady=(0, 4))

        self.progress = ttk.Progressbar(body, orient=tk.HORIZONTAL, mode='determinate')
        self.progress.pack(fill=tk.X, pady=(0, 10))

        # Footer
        footer = tk.Frame(self.root, bg="#18181c", height=48, padx=16, pady=8)
        footer.pack(fill=tk.X, side=tk.BOTTOM)

        self.btn_cancel = tk.Button(footer, text="Cancel", font=("Segoe UI", 9), bg="#2b2b36", fg="#ffffff", relief=tk.FLAT, padx=12, pady=4, cursor="hand2", command=self.root.destroy)
        self.btn_cancel.pack(side=tk.RIGHT, padx=6)

        self.btn_uninstall = tk.Button(footer, text="Uninstall Now", font=("Segoe UI", 9, "bold"), bg="#ef4444", fg="#ffffff", relief=tk.FLAT, padx=14, pady=4, cursor="hand2", command=self.perform_uninstall)
        self.btn_uninstall.pack(side=tk.RIGHT)

    def perform_uninstall(self):
        self.btn_uninstall.config(state=tk.DISABLED)
        self.btn_cancel.config(state=tk.DISABLED)

        try:
            # 1. Kill running processes
            self.status_lbl.config(text="Closing running notepad processes...")
            self.progress['value'] = 20
            self.root.update()
            kill_running_processes()

            # 2. Remove desktop shortcuts
            self.status_lbl.config(text="Removing Desktop shortcuts...")
            self.progress['value'] = 45
            self.root.update()

            for d_path in get_desktop_paths():
                lnk = os.path.join(d_path, "Cross Notepad.lnk")
                if os.path.exists(lnk):
                    try:
                        os.remove(lnk)
                    except Exception:
                        pass

            # 3. Remove Start Menu shortcut
            self.status_lbl.config(text="Removing Start Menu shortcuts...")
            self.progress['value'] = 65
            self.root.update()

            start_menu = os.path.join(os.environ.get("APPDATA", ""), "Microsoft", "Windows", "Start Menu", "Programs", "Cross Notepad.lnk")
            if os.path.exists(start_menu):
                try:
                    os.remove(start_menu)
                except Exception:
                    pass

            # 4. Unregister file associations and Explorer context menus
            self.status_lbl.config(text="Unregistering file associations & context menus...")
            self.progress['value'] = 75
            self.root.update()

            try:
                base_dir = get_base_dir()
                assoc_script = os.path.join(base_dir, "..", "app", "scripts", "register_file_associations.py")
                if os.path.exists(assoc_script):
                    subprocess.run([sys.executable, assoc_script, "--unregister"], capture_output=True)
            except Exception:
                pass

            # 5. Clean installed program directory if in AppData
            self.status_lbl.config(text="Cleaning installation directories...")
            self.progress['value'] = 90
            self.root.update()

            appdata_install = os.path.join(os.environ.get("LOCALAPPDATA", ""), "Programs", "CrossNotepad")
            if os.path.exists(appdata_install):
                try:
                    shutil.rmtree(appdata_install, ignore_errors=True)
                except Exception:
                    pass

            # 6. Refresh Shell
            try:
                ctypes.windll.shell32.SHChangeNotify(0x08000000, 0, None, None)
            except Exception:
                pass

            self.progress['value'] = 100
            self.status_lbl.config(text="Uninstall complete.")
            self.root.update()

            messagebox.showinfo("Uninstall Complete", "Cross Notepad has been successfully uninstalled from your system.")
            self.root.destroy()

        except Exception as e:
            messagebox.showerror("Uninstall Error", f"An error occurred during uninstall:\n{e}")
            self.btn_uninstall.config(state=tk.NORMAL)
            self.btn_cancel.config(state=tk.NORMAL)

def main():
    root = tk.Tk()
    app = UninstallerApp(root)
    root.mainloop()

if __name__ == '__main__':
    main()
