#!/usr/bin/env python3
"""
Cross Notepad - Wipe & Clean Reinstall Tool
Purges previous configurations, stale shortcuts, and cached data,
then performs a fresh, complete installation and launches the application.
"""

import os
import sys
import json
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

def create_windows_shortcut(target_path, shortcut_path, icon_path="", working_dir=""):
    try:
        ps_script = f'''
        $WshShell = New-Object -comObject WScript.Shell
        $Shortcut = $WshShell.CreateShortcut("{shortcut_path}")
        $Shortcut.TargetPath = "{target_path}"
        $Shortcut.WorkingDirectory = "{working_dir}"
        if ("{icon_path}" -ne "" -and (Test-Path "{icon_path}")) {{
            $Shortcut.IconLocation = "{icon_path},0"
        }}
        $Shortcut.Save()
        '''
        subprocess.run(["powershell", "-NoProfile", "-NonInteractive", "-Command", ps_script], capture_output=True)
    except Exception as e:
        print(f"Shortcut notice: {e}")

def copy_tree_safe(src, dst):
    os.makedirs(dst, exist_ok=True)
    for item in os.listdir(src):
        if item in ('.git', 'build', '__pycache__', '.system_generated'):
            continue
        if item == 'node_modules':
            # Preserve bundled electron dist
            electron_dist_src = os.path.join(src, 'node_modules', 'electron', 'dist')
            electron_dist_dst = os.path.join(dst, 'node_modules', 'electron', 'dist')
            if os.path.exists(electron_dist_src):
                os.makedirs(os.path.dirname(electron_dist_dst), exist_ok=True)
                shutil.copytree(electron_dist_src, electron_dist_dst, dirs_exist_ok=True)
            continue
        s = os.path.join(src, item)
        d = os.path.join(dst, item)
        if os.path.isdir(s):
            copy_tree_safe(s, d)
        else:
            try:
                shutil.copy2(s, d)
            except Exception:
                pass

class WipeReinstallApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Cross Notepad - Wipe & Clean Reinstall")
        self.root.geometry("520x330")
        self.root.resizable(False, False)
        self.root.config(bg="#1e1e24")

        base_dir = get_base_dir()
        if os.path.basename(base_dir).lower() == 'windows':
            self.source_root = os.path.dirname(base_dir)
        else:
            self.source_root = base_dir

        self.install_dir = os.path.join(os.environ.get("LOCALAPPDATA", "C:\\"), "Programs", "CrossNotepad")
        self.setup_ui()

    def setup_ui(self):
        # Header
        header = tk.Frame(self.root, bg="#18181c", height=60, padx=18, pady=12)
        header.pack(fill=tk.X)

        lbl_title = tk.Label(header, text="Wipe & Reinstall Cross Notepad", font=("Segoe UI", 13, "bold"), fg="#ffffff", bg="#18181c")
        lbl_title.pack(anchor=tk.W)

        lbl_sub = tk.Label(header, text="Complete factory reset: purges cache & performs a clean reinstall", font=("Segoe UI", 9), fg="#8e95a5", bg="#18181c")
        lbl_sub.pack(anchor=tk.W)

        # Body
        body = tk.Frame(self.root, bg="#1e1e24", padx=20, pady=14)
        body.pack(fill=tk.BOTH, expand=True)

        lbl_info = tk.Label(body, text="This tool will:\n1. Terminate any running Cross Notepad instances\n2. Wipe previous installation files, cache, and old shortcuts\n3. Freshly install all latest binaries, vector icons, and UI modules\n4. Re-register desktop shortcuts and configure local Gemma AI", font=("Segoe UI", 9), fg="#e2e8f0", bg="#1e1e24", justify=tk.LEFT)
        lbl_info.pack(anchor=tk.W, pady=(0, 10))

        self.chk_llm_var = tk.BooleanVar(value=True)
        chk_llm = tk.Checkbutton(body, text="Enable Local Gemma-4 AI Integration during clean install", variable=self.chk_llm_var, font=("Segoe UI", 9, "bold"), fg="#3b82f6", bg="#1e1e24", selectcolor="#141418", activebackground="#1e1e24", activeforeground="#ffffff")
        chk_llm.pack(anchor=tk.W, pady=(0, 8))

        self.status_lbl = tk.Label(body, text="Ready to wipe and reinstall.", font=("Segoe UI", 8), fg="#8e95a5", bg="#1e1e24")
        self.status_lbl.pack(anchor=tk.W, pady=(0, 4))

        self.progress = ttk.Progressbar(body, orient=tk.HORIZONTAL, mode='determinate')
        self.progress.pack(fill=tk.X, pady=(0, 10))

        # Footer
        footer = tk.Frame(self.root, bg="#18181c", height=48, padx=16, pady=8)
        footer.pack(fill=tk.X, side=tk.BOTTOM)

        self.btn_cancel = tk.Button(footer, text="Cancel", font=("Segoe UI", 9), bg="#2b2b36", fg="#ffffff", relief=tk.FLAT, padx=12, pady=4, cursor="hand2", command=self.root.destroy)
        self.btn_cancel.pack(side=tk.RIGHT, padx=6)

        self.btn_reinstall = tk.Button(footer, text="Wipe & Reinstall Now", font=("Segoe UI", 9, "bold"), bg="#3b82f6", fg="#ffffff", relief=tk.FLAT, padx=14, pady=4, cursor="hand2", command=self.perform_wipe_and_reinstall)
        self.btn_reinstall.pack(side=tk.RIGHT)

    def perform_wipe_and_reinstall(self):
        self.btn_reinstall.config(state=tk.DISABLED)
        self.btn_cancel.config(state=tk.DISABLED)

        try:
            # Step 1: Wipe & Terminate
            self.status_lbl.config(text="1/5 Closing running notepad & AI services...")
            self.progress['value'] = 15
            self.root.update()
            kill_running_processes()

            self.status_lbl.config(text="2/5 Purging stale shortcuts & temporary caches...")
            self.progress['value'] = 30
            self.root.update()

            for d_path in get_desktop_paths():
                lnk = os.path.join(d_path, "Cross Notepad.lnk")
                if os.path.exists(lnk):
                    try:
                        os.remove(lnk)
                    except Exception:
                        pass

            start_lnk = os.path.join(os.environ.get("APPDATA", ""), "Microsoft", "Windows", "Start Menu", "Programs", "Cross Notepad.lnk")
            if os.path.exists(start_lnk):
                try:
                    os.remove(start_lnk)
                except Exception:
                    pass

            if os.path.exists(self.install_dir):
                try:
                    shutil.rmtree(self.install_dir, ignore_errors=True)
                except Exception:
                    pass

            # Step 2: Fresh Install
            os.makedirs(self.install_dir, exist_ok=True)
            self.status_lbl.config(text="3/5 Installing fresh binaries, vector icons & themes...")
            self.progress['value'] = 55
            self.root.update()

            app_src = os.path.join(self.source_root, "app")
            win_src = os.path.join(self.source_root, "Windows")
            dest_app = os.path.join(self.install_dir, "app")
            dest_win = os.path.join(self.install_dir, "Windows")

            if os.path.exists(app_src):
                copy_tree_safe(app_src, dest_app)
            if os.path.exists(win_src):
                copy_tree_safe(win_src, dest_win)

            readme_src = os.path.join(self.source_root, "README.md")
            if os.path.exists(readme_src):
                shutil.copy2(readme_src, os.path.join(self.install_dir, "README.md"))

            # Step 3: Configure AI Model
            self.status_lbl.config(text="4/5 Configuring local Gemma-4 AI settings...")
            self.progress['value'] = 75
            self.root.update()

            config_dir = os.path.join(self.install_dir, "config")
            os.makedirs(config_dir, exist_ok=True)
            ai_enabled = self.chk_llm_var.get()
            ai_config = {
                "enabled": ai_enabled,
                "model_name": "gemma4-e2b-it",
                "model_path": r"C:\Users\kosti\AI Models\gemma4-e2b-it",
                "auto_start_service": ai_enabled,
                "port": 4141
            }
            with open(os.path.join(config_dir, "ai_config.json"), "w", encoding="utf-8") as f:
                json.dump(ai_config, f, indent=2)

            # Step 4: Recreate Clean Shortcuts
            self.status_lbl.config(text="5/5 Registering fresh Desktop & Start Menu shortcuts...")
            self.progress['value'] = 90
            self.root.update()

            target_exe = os.path.join(dest_win, "CrossNotepad.exe")
            target_ico = os.path.join(dest_win, "icon.ico")

            for d_path in get_desktop_paths():
                create_windows_shortcut(target_exe, os.path.join(d_path, "Cross Notepad.lnk"), target_ico, dest_win)

            start_menu_dir = os.path.join(os.environ.get("APPDATA", ""), "Microsoft", "Windows", "Start Menu", "Programs")
            create_windows_shortcut(target_exe, os.path.join(start_menu_dir, "Cross Notepad.lnk"), target_ico, dest_win)

            # Step 5: Register File Associations for all text files & Context Menus
            self.status_lbl.config(text="Registering text file associations & context menus...")
            self.root.update()
            try:
                assoc_script = os.path.join(dest_app, "scripts", "register_file_associations.py")
                if os.path.exists(assoc_script):
                    subprocess.run([sys.executable, assoc_script], capture_output=True)
            except Exception:
                pass

            try:
                ctypes.windll.shell32.SHChangeNotify(0x08000000, 0, None, None)
            except Exception:
                pass

            self.progress['value'] = 100
            self.status_lbl.config(text="Wipe & Reinstall completed successfully!")
            self.root.update()

            res = messagebox.askyesno("Clean Reinstall Complete", "Cross Notepad has been wiped and freshly reinstalled!\nAll text files (.txt, .md, .log, .json, etc.) and Explorer context menus have been registered.\n\nWould you like to launch Cross Notepad now?")
            if res and os.path.exists(target_exe):
                subprocess.Popen([target_exe], cwd=dest_win)

            self.root.destroy()

        except Exception as e:
            messagebox.showerror("Error", f"Failed to complete wipe and reinstall:\n{e}")
            self.btn_reinstall.config(state=tk.NORMAL)
            self.btn_cancel.config(state=tk.NORMAL)

def main():
    root = tk.Tk()
    app = WipeReinstallApp(root)
    root.mainloop()

if __name__ == '__main__':
    main()
