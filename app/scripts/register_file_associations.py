#!/usr/bin/env python3
"""
Cross Notepad - Complete Windows File Associations Registrar
Registers Cross Notepad for all text documents, Markdown files, logs, configs,
scripts, and source code files that Windows Notepad and developers use.
Also registers Windows Explorer right-click context menus.
"""

import os
import sys
import winreg
import ctypes

SUPPORTED_EXTENSIONS = [
    # Plain text, Markdown & Free Language (.fl)
    ".fl", ".txt", ".text", ".md", ".markdown", ".mdown", ".mkd", ".rst", ".asciidoc", ".nfo", ".diz", ".tex",
    # System, Config & Logs
    ".log", ".ini", ".cfg", ".conf", ".config", ".inf", ".env", ".toml", ".properties", ".reg",
    # Structured Data & Markup
    ".json", ".jsonl", ".xml", ".yaml", ".yml", ".csv", ".tsv", ".rtf",
    # Scripts & Shells
    ".bat", ".cmd", ".ps1", ".psm1", ".psd1", ".vbs", ".sh", ".bash", ".zsh",
    # Web & Style
    ".html", ".htm", ".xhtml", ".css", ".scss", ".sass", ".less", ".js", ".mjs", ".cjs", ".ts", ".tsx", ".jsx",
    # Programming Languages
    ".py", ".pyw", ".c", ".cpp", ".cc", ".cxx", ".h", ".hpp", ".cs", ".java", ".go", ".rs", ".php", ".rb", ".lua", ".sql",
    # Patches, Subtitles & Dotfiles
    ".diff", ".patch", ".srt", ".sub", ".gitignore", ".gitattributes", ".editorconfig", ".dockerfile"
]

PROG_ID = "Vopple.CrossNotepad.Document"
PROG_NAME = "Cross Notepad Document"
APP_NAME = "Cross Notepad"

def get_installed_paths():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    root_dir = os.path.dirname(base_dir)

    # 1. Check Installed directory
    user_appdata = os.environ.get("LOCALAPPDATA", "C:\\")
    installed_exe = os.path.join(user_appdata, "Programs", "CrossNotepad", "Windows", "CrossNotepad.exe")
    installed_icon = os.path.join(user_appdata, "Programs", "CrossNotepad", "Windows", "icon.ico")

    # 2. Check Workspace directory
    workspace_exe = os.path.join(root_dir, "Windows", "CrossNotepad.exe")
    workspace_icon = os.path.join(root_dir, "Windows", "icon.ico")

    if os.path.exists(installed_exe):
        return installed_exe, (installed_icon if os.path.exists(installed_icon) else installed_exe)
    elif os.path.exists(workspace_exe):
        return workspace_exe, (workspace_icon if os.path.exists(workspace_icon) else workspace_exe)
    else:
        return workspace_exe, workspace_icon

def set_reg_value(root_key, sub_key_path, value_name, value_data, value_type=winreg.REG_SZ):
    try:
        with winreg.CreateKey(root_key, sub_key_path) as key:
            winreg.SetValueEx(key, value_name, 0, value_type, value_data)
        return True
    except Exception as e:
        print(f"Failed to set {sub_key_path}\\{value_name}: {e}")
        return False

def delete_reg_key_tree(root_key, sub_key_path):
    try:
        with winreg.OpenKey(root_key, sub_key_path, 0, winreg.KEY_ALL_ACCESS) as key:
            while True:
                try:
                    sub_key = winreg.EnumKey(key, 0)
                    delete_reg_key_tree(key, sub_key)
                except OSError:
                    break
        winreg.DeleteKey(root_key, sub_key_path)
    except Exception:
        pass

def register_associations():
    exe_path, icon_path = get_installed_paths()
    print(f"Registering Cross Notepad File Associations...")
    print(f"  Target Executable: {exe_path}")
    print(f"  Application Icon: {icon_path}")

    # 1. Register ProgID
    prog_key = f"Software\\Classes\\{PROG_ID}"
    set_reg_value(winreg.HKEY_CURRENT_USER, prog_key, "", PROG_NAME)
    set_reg_value(winreg.HKEY_CURRENT_USER, f"{prog_key}\\DefaultIcon", "", f'"{icon_path}",0')
    set_reg_value(winreg.HKEY_CURRENT_USER, f"{prog_key}\\shell\\open\\command", "", f'"{exe_path}" "%1"')
    set_reg_value(winreg.HKEY_CURRENT_USER, f"{prog_key}\\shell\\edit\\command", "", f'"{exe_path}" "%1"')

    # 2. Register Application in Registered Applications
    app_key = "Software\\Classes\\Applications\\CrossNotepad.exe"
    set_reg_value(winreg.HKEY_CURRENT_USER, app_key, "FriendlyAppName", APP_NAME)
    set_reg_value(winreg.HKEY_CURRENT_USER, f"{app_key}\\DefaultIcon", "", f'"{icon_path}",0')
    set_reg_value(winreg.HKEY_CURRENT_USER, f"{app_key}\\shell\\open\\command", "", f'"{exe_path}" "%1"')
    set_reg_value(winreg.HKEY_CURRENT_USER, f"{app_key}\\SupportedTypes", "", "")

    for ext in SUPPORTED_EXTENSIONS:
        set_reg_value(winreg.HKEY_CURRENT_USER, f"{app_key}\\SupportedTypes", ext, "")

    # 3. Associate all text extensions
    count = 0
    for ext in SUPPORTED_EXTENSIONS:
        ext_key = f"Software\\Classes\\{ext}"
        # Set OpenWithProgids & OpenWithList
        set_reg_value(winreg.HKEY_CURRENT_USER, f"{ext_key}\\OpenWithProgids", PROG_ID, "", winreg.REG_SZ)
        set_reg_value(winreg.HKEY_CURRENT_USER, f"{ext_key}\\OpenWithList\\CrossNotepad.exe", "", "")
        
        # Primary document types (.fl, .txt, .md, .log, .json, .yaml, .ini, .csv, .xml, .rtf) default association
        if ext in [".fl", ".txt", ".md", ".markdown", ".log", ".ini", ".cfg", ".conf", ".json", ".xml", ".yaml", ".yml", ".csv", ".tsv", ".rtf"]:
            set_reg_value(winreg.HKEY_CURRENT_USER, ext_key, "", PROG_ID)
        count += 1

    # 4. Context Menu: "Open with Cross Notepad" for ALL files (*)
    context_file_key = "Software\\Classes\\*\\shell\\CrossNotepad"
    set_reg_value(winreg.HKEY_CURRENT_USER, context_file_key, "", "Open with Cross Notepad")
    set_reg_value(winreg.HKEY_CURRENT_USER, context_file_key, "Icon", f'"{icon_path}"')
    set_reg_value(winreg.HKEY_CURRENT_USER, f"{context_file_key}\\command", "", f'"{exe_path}" "%1"')

    # 5. Context Menu: "Open Cross Notepad here" for Directory background
    context_bg_key = "Software\\Classes\\Directory\\Background\\shell\\CrossNotepad"
    set_reg_value(winreg.HKEY_CURRENT_USER, context_bg_key, "", "Open Cross Notepad here")
    set_reg_value(winreg.HKEY_CURRENT_USER, context_bg_key, "Icon", f'"{icon_path}"')
    set_reg_value(winreg.HKEY_CURRENT_USER, f"{context_bg_key}\\command", "", f'"{exe_path}"')

    # 6. Windows Capabilities & Default Apps Registration
    cap_key = "Software\\Clients\\CrossNotepad\\Capabilities"
    set_reg_value(winreg.HKEY_CURRENT_USER, cap_key, "ApplicationName", APP_NAME)
    set_reg_value(winreg.HKEY_CURRENT_USER, cap_key, "ApplicationDescription", "Fast, modern cross-platform notepad with local AI and Markdown support.")
    for ext in SUPPORTED_EXTENSIONS:
        set_reg_value(winreg.HKEY_CURRENT_USER, f"{cap_key}\\FileAssociations", ext, PROG_ID)
    
    set_reg_value(winreg.HKEY_CURRENT_USER, "Software\\RegisteredApplications", APP_NAME, "Software\\Clients\\CrossNotepad\\Capabilities")

    # 7. Notify Windows Shell of association refresh
    try:
        SHCNE_ASSOCCHANGED = 0x08000000
        SHCNF_IDLIST = 0x0000
        ctypes.windll.shell32.SHChangeNotify(SHCNE_ASSOCCHANGED, SHCNF_IDLIST, None, None)
        print("[OK] Shell association change notification broadcasted successfully!")
    except Exception as e:
        print(f"Shell refresh notice: {e}")

    print(f"[OK] Successfully registered {count} file extensions and Explorer context menus for Cross Notepad!")

def unregister_associations():
    print("Unregistering Cross Notepad File Associations...")
    delete_reg_key_tree(winreg.HKEY_CURRENT_USER, f"Software\\Classes\\{PROG_ID}")
    delete_reg_key_tree(winreg.HKEY_CURRENT_USER, "Software\\Classes\\Applications\\CrossNotepad.exe")
    delete_reg_key_tree(winreg.HKEY_CURRENT_USER, "Software\\Classes\\*\\shell\\CrossNotepad")
    delete_reg_key_tree(winreg.HKEY_CURRENT_USER, "Software\\Classes\\Directory\\Background\\shell\\CrossNotepad")
    delete_reg_key_tree(winreg.HKEY_CURRENT_USER, "Software\\Clients\\CrossNotepad")

    try:
        with winreg.OpenKey(winreg.HKEY_CURRENT_USER, "Software\\RegisteredApplications", 0, winreg.KEY_SET_VALUE) as key:
            winreg.DeleteValue(key, APP_NAME)
    except Exception:
        pass

    try:
        SHCNE_ASSOCCHANGED = 0x08000000
        SHCNF_IDLIST = 0x0000
        ctypes.windll.shell32.SHChangeNotify(SHCNE_ASSOCCHANGED, SHCNF_IDLIST, None, None)
    except Exception:
        pass

    print("[OK] Successfully cleaned up file associations.")

if __name__ == "__main__":
    if "--unregister" in sys.argv:
        unregister_associations()
    else:
        register_associations()
