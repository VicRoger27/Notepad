# Cross Notepad 📝✨

A fast, modern, distraction-free Notepad for **Windows** and **Linux** with native support for **Plain Text (`.txt`)**, **Markdown (`.md`)**, **Rich Text (`.rtf`)**, **Flashcard Notes (`.fl`)**, and offline local **Gemma-4 AI (`gemma4-e2b-it`)**.

---

## 🚀 Key Features

- 🌈 **Dynamic Rainbow Blinking Cursor**: Interactive color-wheel caret that shifts hue by 10° per blink cycle, with full manual slider controls and toggle.
- 🎨 **Custom Accent Color**: Choose from 8 vibrant preset palettes (Sky Blue, Electric Blue, Emerald Mint, Cyber Purple, Neon Pink, Sunset Orange, Solar Yellow, Cyan Arctic) or pick any custom hex tint.
- ⚙️ **Preferences & Settings Bar (`Ctrl+,`)**: Configure typography scale, caret animation speed, themes, and line numbers with live interactive previews.
- 🔣 **Unicode Symbol Inserter (`Ctrl+U`)**: Dual-mode character browser with offline math/arrow/Greek symbols and Compart.com search integration.
- 🤖 **Offline Gemma-4 AI Assistant**: Local summarization, prose continuation, grammar polish, and Markdown conversion powered by your offline Gemma-4 model.
- ⚡ **Dual Operation Modes**: Full AI-assisted workspace vs. Instant Ultralight / Incognito Mode (`Ctrl+Shift+X`).
- 📁 **Multi-Tab Architecture**: Seamless document management with auto-recovery and dirty state indicators.

---

## 📁 Project Directory Layout

```
NotePad/
├── 📁 Windows/                     # Windows executables, installers & tools
│   ├── CrossNotepad.exe            # Windows Notepad standalone application
│   ├── CrossNotepad-Setup-1.0.0.exe# Standard Setup Installation Wizard
│   ├── CrossNotepad-1.0.0.msi      # Enterprise / GPO MSI installer
│   ├── Wipe-And-Reinstall.exe      # Complete clean-slate reinstaller tool
│   ├── Uninstall.exe               # Standalone uninstaller tool
│   ├── Create-Desktop-Shortcut.exe # One-click desktop shortcut creator
│   ├── Register-File-Associations.exe # Shell context menu & extension binder
│   ├── notepad.bat                 # Quick launch batch script
│   └── icon.ico / windows_logo.jpg # Branding icons & artwork
│
├── 📁 Linux/                       # Linux executables, packages & tools
│   ├── CrossNotepad.elf            # Standalone 64-bit Linux ELF binary
│   ├── CrossNotepad-1.0.0.AppImage # Universal Linux AppImage package
│   ├── cross-notepad_1.0.0_amd64.deb # Debian / Ubuntu / Mint package
│   ├── cross-notepad-1.0.0.x86_64.rpm# Fedora / RHEL package
│   ├── Create-Shortcut.AppImage    # Linux shortcut creator AppImage
│   ├── create-shortcut_1.0.0_amd64.deb # Shortcut creator DEB package
│   ├── notepad.sh                  # Linux shell launcher
│   └── linux_logo.jpg              # Linux Tux artwork
│
├── 📁 app/                         # Application source code & assets
│   ├── src/                        # HTML, Vanilla CSS, JS & vector assets
│   ├── main.js                     # Electron runtime & window management
│   ├── preload.js                  # IPC security bridge
│   ├── ai_service.py               # Gemma-4 local AI backend
│   └── package.json                # Dependencies & build configuration
│
└── 📄 README.md                    # Project documentation
```

---

## 🪟 Windows Suite (`Windows/`)

| File | Type | Description |
| :--- | :--- | :--- |
| **`CrossNotepad.exe`** | Application | Main standalone application |
| **`CrossNotepad-Setup-1.0.0.exe`** | Installer | Interactive Setup Wizard |
| **`CrossNotepad-1.0.0.msi`** | Installer | Windows MSI installer (Enterprise / GPO ready) |
| **`Wipe-And-Reinstall.exe`** | Utility | Purges registry & app data, reinstalling fresh files |
| **`Uninstall.exe`** | Utility | Clean uninstallation & registry cleanup tool |
| **`Create-Desktop-Shortcut.exe`**| Utility | Adds a high-res desktop shortcut |
| **`Register-File-Associations.exe`**| Utility | Binds 76 text/code file extensions to Cross Notepad |

---

## 🐧 Linux Suite (`Linux/`)

| File | Type | Description |
| :--- | :--- | :--- |
| **`CrossNotepad.elf`** | Executable | 64-bit ELF binary (`chmod +x && ./CrossNotepad.elf`) |
| **`CrossNotepad-1.0.0.AppImage`** | AppImage | Universal portable AppImage |
| **`cross-notepad_1.0.0_amd64.deb`** | Package | Debian / Ubuntu installer (`sudo dpkg -i ...`) |
| **`cross-notepad-1.0.0.x86_64.rpm`** | Package | Fedora / RHEL installer (`sudo rpm -i ...`) |
| **`Create-Shortcut.AppImage`** | AppImage | Desktop launcher generator for Linux desktops |

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| <kbd>Ctrl+N</kbd> | New Tab / Plain Text Document |
| <kbd>Ctrl+Shift+N</kbd> | New Rich Text Document (`.rtf`) |
| <kbd>Ctrl+O</kbd> | Open File (`.txt`, `.md`, `.rtf`, `.fl`) |
| <kbd>Ctrl+S</kbd> | Save Document |
| <kbd>Ctrl+Shift+S</kbd> | Save As |
| <kbd>Ctrl+W</kbd> | Close Current Tab |
| <kbd>Ctrl+P</kbd> | Toggle Markdown Live Preview |
| <kbd>Ctrl+F</kbd> | Find in Document |
| <kbd>Ctrl+H</kbd> | Find and Replace |
| <kbd>Ctrl+U</kbd> | Unicode Symbol & Character Viewer |
| <kbd>Ctrl+,</kbd> | Preferences, Caret Speed & Custom Accents |
| <kbd>Ctrl+Shift+X</kbd> | Switch to Ultralight Mode (No AI) |
| <kbd>Ctrl+Shift+Z</kbd> | Switch to AI-Enabled Mode |
| <kbd>Alt+Z</kbd> | Toggle Word Wrap |
| <kbd>Alt+L</kbd> | Toggle Line Numbers |
| <kbd>F5</kbd> | Insert Current Date & Time |

---

## 📄 License
MIT License. Free for personal and commercial use.
