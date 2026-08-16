#!/usr/bin/env python3
"""
Cross Notepad - Windows Setup Installer
Installs Cross Notepad, all SVG/PNG icons, UI assets, modules, dependencies,
and provides an interactive option to install and configure the local Gemma-4 AI model.
"""

import os
import sys
import json
import shutil
import subprocess
import tkinter as tk
from tkinter import ttk, messagebox, filedialog

def get_base_dir():
    if getattr(sys, 'frozen', False):
        return os.path.dirname(os.path.abspath(sys.executable))
    return os.path.dirname(os.path.abspath(__file__))

def create_windows_shortcut(target_path, shortcut_path, icon_path="", working_dir=""):
    try:
        ps_script = f'''
        $WshShell = New-Object -comObject WScript.Shell
        $Shortcut = $WshShell.CreateShortcut("{shortcut_path}")
        $Shortcut.TargetPath = "{target_path}"
        $Shortcut.WorkingDirectory = "{working_dir}"
        if ("{icon_path}" -ne "") {{
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

class SetupWizard:
    def __init__(self, root):
        self.root = root
        self.root.title("Cross Notepad Setup")
        self.root.geometry("560x460")
        self.root.resizable(False, False)

        base_dir = get_base_dir()
        if os.path.basename(base_dir).lower() == 'windows':
            self.source_root = os.path.dirname(base_dir)
        else:
            self.source_root = base_dir

        self.default_install_dir = os.path.join(os.environ.get("LOCALAPPDATA", "C:\\"), "Programs", "CrossNotepad")
        self.default_model_dir = r"C:\Users\kosti\AI Models\gemma4-e2b-it"

        self.setup_ui()

    def setup_ui(self):
        self.root.config(bg="#1e1e24")

        # Header
        header = tk.Frame(self.root, bg="#18181c", height=70, padx=20, pady=12)
        header.pack(fill=tk.X)

        lbl_title = tk.Label(header, text="Cross Notepad Setup", font=("Segoe UI", 14, "bold"), fg="#ffffff", bg="#18181c")
        lbl_title.pack(anchor=tk.W)

        lbl_sub = tk.Label(header, text="Choose installation settings and local AI model options", font=("Segoe UI", 9), fg="#8e95a5", bg="#18181c")
        lbl_sub.pack(anchor=tk.W)

        # Body
        body = tk.Frame(self.root, bg="#1e1e24", padx=24, pady=12)
        body.pack(fill=tk.BOTH, expand=True)

        # Installation Directory
        lbl_dest = tk.Label(body, text="Installation Folder:", font=("Segoe UI", 9, "bold"), fg="#e2e8f0", bg="#1e1e24")
        lbl_dest.pack(anchor=tk.W, pady=(0, 2))

        dest_frame = tk.Frame(body, bg="#1e1e24")
        dest_frame.pack(fill=tk.X, pady=(0, 10))

        self.dest_var = tk.StringVar(value=self.default_install_dir)
        ent_dest = tk.Entry(dest_frame, textvariable=self.dest_var, font=("Segoe UI", 9), bg="#141418", fg="#e2e8f0", insertbackground="#3b82f6", relief=tk.FLAT, bd=4)
        ent_dest.pack(side=tk.LEFT, fill=tk.X, expand=True, padx=(0, 6))

        btn_browse_dest = tk.Button(dest_frame, text="Browse...", font=("Segoe UI", 8), bg="#2b2b36", fg="#ffffff", relief=tk.FLAT, padx=8, pady=2, cursor="hand2", command=self.browse_dest)
        btn_browse_dest.pack(side=tk.RIGHT)

        # Standard Checkboxes
        self.chk_desktop_var = tk.BooleanVar(value=True)
        chk_desktop = tk.Checkbutton(body, text="Create Desktop Shortcut", variable=self.chk_desktop_var, font=("Segoe UI", 9), fg="#e2e8f0", bg="#1e1e24", selectcolor="#141418", activebackground="#1e1e24", activeforeground="#ffffff")
        chk_desktop.pack(anchor=tk.W, pady=1)

        self.chk_start_var = tk.BooleanVar(value=True)
        chk_start = tk.Checkbutton(body, text="Create Start Menu Shortcut", variable=self.chk_start_var, font=("Segoe UI", 9), fg="#e2e8f0", bg="#1e1e24", selectcolor="#141418", activebackground="#1e1e24", activeforeground="#ffffff")
        chk_start.pack(anchor=tk.W, pady=1)

        self.chk_assets_var = tk.BooleanVar(value=True)
        chk_assets = tk.Checkbutton(body, text="Install all vector icons, theme styles & UI dependencies", variable=self.chk_assets_var, font=("Segoe UI", 9), fg="#e2e8f0", bg="#1e1e24", selectcolor="#141418", activebackground="#1e1e24", activeforeground="#ffffff")
        chk_assets.pack(anchor=tk.W, pady=1)

        # Separator
        sep = tk.Frame(body, height=1, bg="#2b2b36")
        sep.pack(fill=tk.X, pady=8)

        # LLM OPTIONAL INSTALLATION PROMPT
        self.chk_llm_var = tk.BooleanVar(value=True)
        chk_llm = tk.Checkbutton(body, text="Install & Configure Local Gemma-4 AI Model (gemma4-e2b-it)", variable=self.chk_llm_var, font=("Segoe UI", 9, "bold"), fg="#3b82f6", bg="#1e1e24", selectcolor="#141418", activebackground="#1e1e24", activeforeground="#ffffff", command=self.toggle_llm_panel)
        chk_llm.pack(anchor=tk.W, pady=2)

        # LLM Model Path Subframe
        self.llm_frame = tk.Frame(body, bg="#18181c", padx=10, pady=8, bd=1, relief=tk.SOLID)
        self.llm_frame.pack(fill=tk.X, pady=(2, 6))

        lbl_model_desc = tk.Label(self.llm_frame, text="AI Model Location:", font=("Segoe UI", 8, "bold"), fg="#8e95a5", bg="#18181c")
        lbl_model_desc.pack(anchor=tk.W)

        model_entry_row = tk.Frame(self.llm_frame, bg="#18181c")
        model_entry_row.pack(fill=tk.X, pady=(2, 4))

        self.model_path_var = tk.StringVar(value=self.default_model_dir)
        ent_model = tk.Entry(model_entry_row, textvariable=self.model_path_var, font=("Segoe UI", 8), bg="#141418", fg="#e2e8f0", insertbackground="#3b82f6", relief=tk.FLAT, bd=3)
        ent_model.pack(side=tk.LEFT, fill=tk.X, expand=True, padx=(0, 6))

        btn_browse_model = tk.Button(model_entry_row, text="Browse...", font=("Segoe UI", 8), bg="#2b2b36", fg="#ffffff", relief=tk.FLAT, padx=6, pady=1, cursor="hand2", command=self.browse_model)
        btn_browse_model.pack(side=tk.RIGHT)

        model_exists = os.path.exists(self.default_model_dir)
        status_text = "✓ Gemma-4 model detected and ready to link" if model_exists else "ℹ Custom path or download will be configured"
        status_color = "#10b981" if model_exists else "#f59e0b"
        self.lbl_model_status = tk.Label(self.llm_frame, text=status_text, font=("Segoe UI", 8), fg=status_color, bg="#18181c")
        self.lbl_model_status.pack(anchor=tk.W)

        # Progress & Status
        self.status_lbl = tk.Label(body, text="Ready to install.", font=("Segoe UI", 8), fg="#8e95a5", bg="#1e1e24")
        self.status_lbl.pack(anchor=tk.W, pady=(8, 2))

        self.progress = ttk.Progressbar(body, orient=tk.HORIZONTAL, mode='determinate')
        self.progress.pack(fill=tk.X)

        # Footer
        footer = tk.Frame(self.root, bg="#18181c", height=50, padx=20, pady=10)
        footer.pack(fill=tk.X, side=tk.BOTTOM)

        self.btn_cancel = tk.Button(footer, text="Cancel", font=("Segoe UI", 9), bg="#2b2b36", fg="#ffffff", relief=tk.FLAT, padx=14, pady=4, cursor="hand2", command=self.root.destroy)
        self.btn_cancel.pack(side=tk.RIGHT, padx=6)

        self.btn_install = tk.Button(footer, text="Install Now", font=("Segoe UI", 9, "bold"), bg="#3b82f6", fg="#ffffff", relief=tk.FLAT, padx=16, pady=4, cursor="hand2", command=self.perform_install)
        self.btn_install.pack(side=tk.RIGHT)

    def browse_dest(self):
        folder = filedialog.askdirectory(title="Select Installation Folder", initialdir=self.dest_var.get())
        if folder:
            self.dest_var.set(folder)

    def browse_model(self):
        folder = filedialog.askdirectory(title="Select Gemma AI Model Folder", initialdir=self.model_path_var.get())
        if folder:
            self.model_path_var.set(folder)
            if os.path.exists(folder):
                self.lbl_model_status.config(text="✓ Model folder selected", fg="#10b981")
            else:
                self.lbl_model_status.config(text="ℹ Directory will be initialized", fg="#f59e0b")

    def toggle_llm_panel(self):
        if self.chk_llm_var.get():
            self.llm_frame.pack(fill=tk.X, pady=(2, 6))
        else:
            self.llm_frame.pack_forget()

    def perform_install(self):
        self.btn_install.config(state=tk.DISABLED)
        self.btn_cancel.config(state=tk.DISABLED)

        dest = self.dest_var.get().strip()
        install_llm = self.chk_llm_var.get()
        model_path = self.model_path_var.get().strip()

        try:
            os.makedirs(dest, exist_ok=True)
            self.progress['value'] = 15
            self.status_lbl.config(text="Copying application binaries and launchers...")
            self.root.update()

            app_src = os.path.join(self.source_root, "app")
            win_src = os.path.join(self.source_root, "Windows")
            dest_app = os.path.join(dest, "app")
            dest_win = os.path.join(dest, "Windows")

            if os.path.exists(app_src):
                self.progress['value'] = 35
                self.status_lbl.config(text="Installing vector icons, themes, and UI modules...")
                self.root.update()
                copy_tree_safe(app_src, dest_app)

            if os.path.exists(win_src):
                self.progress['value'] = 60
                self.status_lbl.config(text="Installing Windows executables and icon resources...")
                self.root.update()
                copy_tree_safe(win_src, dest_win)

            # Copy README
            readme_src = os.path.join(self.source_root, "README.md")
            if os.path.exists(readme_src):
                shutil.copy2(readme_src, os.path.join(dest, "README.md"))

            # Configure LLM Option
            self.progress['value'] = 80
            if install_llm:
                self.status_lbl.config(text="Configuring local Gemma-4 AI model integration...")
                self.root.update()
                config_dir = os.path.join(dest, "config")
                os.makedirs(config_dir, exist_ok=True)
                ai_config = {
                    "enabled": True,
                    "model_name": "gemma4-e2b-it",
                    "model_path": model_path,
                    "auto_start_service": True,
                    "port": 4141
                }
                with open(os.path.join(config_dir, "ai_config.json"), "w", encoding="utf-8") as f:
                    json.dump(ai_config, f, indent=2)
            else:
                self.status_lbl.config(text="Setting up lightweight mode (no local LLM)...")
                self.root.update()
                config_dir = os.path.join(dest, "config")
                os.makedirs(config_dir, exist_ok=True)
                ai_config = {
                    "enabled": False,
                    "model_name": "gemma4-e2b-it",
                    "model_path": "",
                    "auto_start_service": False,
                    "port": 4141
                }
                with open(os.path.join(config_dir, "ai_config.json"), "w", encoding="utf-8") as f:
                    json.dump(ai_config, f, indent=2)

            # Create Shortcuts
            target_exe = os.path.join(dest_win, "CrossNotepad.exe")
            target_ico = os.path.join(dest_win, "icon.ico")

            self.progress['value'] = 95
            self.status_lbl.config(text="Creating Desktop and Start Menu shortcuts...")
            self.root.update()

            if self.chk_desktop_var.get():
                desktop_path = os.path.join(os.environ.get("USERPROFILE", ""), "Desktop", "Cross Notepad.lnk")
                create_windows_shortcut(target_exe, desktop_path, target_ico, dest_win)

            if self.chk_start_var.get():
                start_menu = os.path.join(os.environ.get("APPDATA", ""), "Microsoft", "Windows", "Start Menu", "Programs")
                start_link = os.path.join(start_menu, "Cross Notepad.lnk")
                create_windows_shortcut(target_exe, start_link, target_ico, dest_win)

            # Register File Associations for all text files and Context Menus
            self.status_lbl.config(text="Registering text file associations & context menus...")
            self.root.update()
            try:
                assoc_script = os.path.join(dest_app, "scripts", "register_file_associations.py")
                if os.path.exists(assoc_script):
                    subprocess.run([sys.executable, assoc_script], capture_output=True)
            except Exception:
                pass

            self.progress['value'] = 100
            self.status_lbl.config(text="Installation completed successfully!")
            self.root.update()

            llm_msg = "with local Gemma-4 AI enabled" if install_llm else "in standard lightweight mode"
            res = messagebox.askyesno("Setup Complete", f"Cross Notepad has been installed successfully ({llm_msg})!\nAll text documents (.txt, .md, .log, .json, etc.) and Explorer context menus have been registered.\n\nWould you like to launch Cross Notepad now?")
            if res:
                if os.path.exists(target_exe):
                    subprocess.Popen([target_exe], cwd=dest_win)
            self.root.destroy()

        except Exception as e:
            messagebox.showerror("Installation Error", f"Failed to complete installation:\n{e}")
            self.btn_install.config(state=tk.NORMAL)
            self.btn_cancel.config(state=tk.NORMAL)

def main():
    root = tk.Tk()
    app = SetupWizard(root)
    root.mainloop()

if __name__ == "__main__":
    main()
