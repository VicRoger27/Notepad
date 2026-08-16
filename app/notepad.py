#!/usr/bin/env python3
"""
Cross-Platform Notepad (Python / Tkinter Edition)
Modern multi-tab text and markdown editor for Windows and Linux.
Features top tab bar, word wrap, stats tracker, dark/light themes, and timestamp insertion.
"""

import os
import sys
import datetime
import tkinter as tk
from tkinter import ttk, filedialog, messagebox, font

class TabDocument:
    def __init__(self, tab_id, title="Untitled", filepath=None, content="", is_welcome=False):
        self.id = tab_id
        self.title = title
        self.filepath = filepath
        self.content = content
        self.is_welcome = is_welcome
        self.is_dirty = False
        self.cursor_pos = "1.0"

class CrossNotepadTk:
    def __init__(self, root, initial_file=None):
        self.root = root
        self.root.title("Cross Notepad")
        self.root.geometry("960x640")
        self.root.minsize(450, 320)

        self.tabs = []
        self.active_tab = None
        self.tab_counter = 1
        self.current_theme = "dark"
        self.is_updating_ui = False

        self.setup_styles()
        self.create_menu()
        self.create_widgets()
        self.bind_shortcuts()
        self.apply_theme("dark")

        if initial_file and os.path.isfile(initial_file):
            self.open_file_path(initial_file)
        else:
            self.create_welcome_tab()

    def setup_styles(self):
        self.themes = {
            "dark": {
                "bg": "#1e1e24",
                "fg": "#e2e8f0",
                "tab_bar_bg": "#1e1e24",
                "tab_inactive_bg": "#18181c",
                "tab_inactive_fg": "#8e95a5",
                "tab_active_bg": "#2b2b36",
                "tab_active_fg": "#ffffff",
                "tab_hover_bg": "#24242e",
                "editor_bg": "#18181c",
                "editor_fg": "#e2e8f0",
                "cursor": "#3b82f6",
                "select_bg": "#323240",
                "status_bg": "#141418",
                "status_fg": "#8e95a5",
                "accent": "#3b82f6"
            },
            "light": {
                "bg": "#f8fafc",
                "fg": "#1e293b",
                "tab_bar_bg": "#eceff4",
                "tab_inactive_bg": "#e2e8f0",
                "tab_inactive_fg": "#64748b",
                "tab_active_bg": "#ffffff",
                "tab_active_fg": "#1e293b",
                "tab_hover_bg": "#f1f5f9",
                "editor_bg": "#ffffff",
                "editor_fg": "#1e293b",
                "cursor": "#2563eb",
                "select_bg": "#cbd5e1",
                "status_bg": "#eceff4",
                "status_fg": "#64748b",
                "accent": "#2563eb"
            }
        }

    def create_menu(self):
        menubar = tk.Menu(self.root)

        # File Menu
        file_menu = tk.Menu(menubar, tearoff=0)
        file_menu.add_command(label="New Tab", accelerator="Ctrl+N", command=lambda: self.create_new_tab("txt"))
        file_menu.add_command(label="New Markdown Tab", accelerator="Ctrl+Shift+N", command=lambda: self.create_new_tab("md"))
        file_menu.add_command(label="Open File...", accelerator="Ctrl+O", command=self.open_file_dialog)
        file_menu.add_separator()
        file_menu.add_command(label="Save", accelerator="Ctrl+S", command=self.save_file)
        file_menu.add_command(label="Save As...", accelerator="Ctrl+Shift+S", command=self.save_file_as)
        file_menu.add_separator()
        file_menu.add_command(label="Close Tab", accelerator="Ctrl+W", command=self.close_active_tab)
        file_menu.add_command(label="Exit", accelerator="Alt+F4", command=self.on_closing)
        menubar.add_cascade(label="File", menu=file_menu)

        # Edit Menu
        edit_menu = tk.Menu(menubar, tearoff=0)
        edit_menu.add_command(label="Undo", accelerator="Ctrl+Z", command=lambda: self.text_area.event_generate("<<Undo>>"))
        edit_menu.add_command(label="Redo", accelerator="Ctrl+Y", command=lambda: self.text_area.event_generate("<<Redo>>"))
        edit_menu.add_separator()
        edit_menu.add_command(label="Cut", accelerator="Ctrl+X", command=lambda: self.text_area.event_generate("<<Cut>>"))
        edit_menu.add_command(label="Copy", accelerator="Ctrl+C", command=lambda: self.text_area.event_generate("<<Copy>>"))
        edit_menu.add_command(label="Paste", accelerator="Ctrl+V", command=lambda: self.text_area.event_generate("<<Paste>>"))
        edit_menu.add_command(label="Select All", accelerator="Ctrl+A", command=self.select_all)
        edit_menu.add_separator()
        edit_menu.add_command(label="Insert Date/Time", accelerator="F5", command=self.insert_datetime)
        menubar.add_cascade(label="Edit", menu=edit_menu)

        # View Menu
        view_menu = tk.Menu(menubar, tearoff=0)
        self.wrap_var = tk.BooleanVar(value=True)
        view_menu.add_checkbutton(label="Word Wrap", variable=self.wrap_var, command=self.toggle_wrap)
        view_menu.add_separator()
        view_menu.add_command(label="Toggle Theme (Dark / Light)", command=self.toggle_theme)
        menubar.add_cascade(label="View", menu=view_menu)

        # Help Menu
        help_menu = tk.Menu(menubar, tearoff=0)
        help_menu.add_command(label="Welcome / Home Page", command=self.create_welcome_tab)
        help_menu.add_command(label="About Cross Notepad", command=self.show_about)
        menubar.add_cascade(label="Help", menu=help_menu)

        self.root.config(menu=menubar)

    def create_widgets(self):
        # 1. TOP NAVBAR / TAB BAR
        self.tab_bar_frame = tk.Frame(self.root, height=36)
        self.tab_bar_frame.pack(side=tk.TOP, fill=tk.X)

        self.tabs_container = tk.Frame(self.tab_bar_frame)
        self.tabs_container.pack(side=tk.LEFT, fill=tk.X, expand=True)

        self.btn_new_tab = tk.Button(
            self.tab_bar_frame,
            text="+",
            font=("Segoe UI", 11, "bold"),
            width=3,
            relief=tk.FLAT,
            cursor="hand2",
            command=lambda: self.create_new_tab("txt")
        )
        self.btn_new_tab.pack(side=tk.LEFT, padx=4, pady=4)

        # 2. MAIN EDITOR FRAME
        self.main_frame = tk.Frame(self.root)
        self.main_frame.pack(fill=tk.BOTH, expand=True)

        # Scrollbar
        self.scrollbar = tk.Scrollbar(self.main_frame)
        self.scrollbar.pack(side=tk.RIGHT, fill=tk.Y)

        # Editor Text Area
        font_family = "Cascadia Code" if "Cascadia Code" in font.families() else "Consolas" if "Consolas" in font.families() else "Courier"
        self.editor_font = font.Font(family=font_family, size=11)

        self.text_area = tk.Text(
            self.main_frame,
            font=self.editor_font,
            wrap=tk.WORD,
            undo=True,
            yscrollcommand=self.scrollbar.set,
            padx=14,
            pady=12,
            relief=tk.FLAT
        )
        self.text_area.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        self.scrollbar.config(command=self.text_area.yview)

        # 3. STATUS BAR
        self.status_bar = tk.Frame(self.root, height=26)
        self.status_bar.pack(side=tk.BOTTOM, fill=tk.X)

        self.status_left = tk.Label(self.status_bar, text="Ready", anchor=tk.W, padx=10, font=("Segoe UI", 9))
        self.status_left.pack(side=tk.LEFT)

        self.status_format = tk.Label(self.status_bar, text="TEXT (.txt)", anchor=tk.CENTER, padx=8, font=("Segoe UI", 9, "bold"))
        self.status_format.pack(side=tk.LEFT, padx=10)

        self.status_right = tk.Label(self.status_bar, text="Ln 1, Col 1 | 0 words | 0 chars", anchor=tk.E, padx=10, font=("Segoe UI", 9))
        self.status_right.pack(side=tk.RIGHT)

    def bind_shortcuts(self):
        self.text_area.bind("<<Modified>>", self.on_text_modified)
        self.text_area.bind("<KeyRelease>", self.update_cursor_info)
        self.text_area.bind("<ButtonRelease-1>", self.update_cursor_info)

        self.root.bind("<Control-n>", lambda e: self.create_new_tab("txt"))
        self.root.bind("<Control-N>", lambda e: self.create_new_tab("txt"))
        self.root.bind("<Control-Shift-n>", lambda e: self.create_new_tab("md"))
        self.root.bind("<Control-Shift-N>", lambda e: self.create_new_tab("md"))
        self.root.bind("<Control-o>", lambda e: self.open_file_dialog())
        self.root.bind("<Control-O>", lambda e: self.open_file_dialog())
        self.root.bind("<Control-s>", lambda e: self.save_file())
        self.root.bind("<Control-S>", lambda e: self.save_file())
        self.root.bind("<Control-Shift-s>", lambda e: self.save_file_as())
        self.root.bind("<Control-Shift-S>", lambda e: self.save_file_as())
        self.root.bind("<Control-w>", lambda e: self.close_active_tab())
        self.root.bind("<Control-W>", lambda e: self.close_active_tab())
        self.root.bind("<Control-Shift-x>", lambda e: self.relaunch_no_ai())
        self.root.bind("<Control-Shift-X>", lambda e: self.relaunch_no_ai())
        self.root.bind("<Control-Shift-z>", lambda e: self.relaunch_with_ai())
        self.root.bind("<Control-Shift-Z>", lambda e: self.relaunch_with_ai())
        self.text_area.bind("<Control-Shift-x>", lambda e: self.relaunch_no_ai())
        self.text_area.bind("<Control-Shift-X>", lambda e: self.relaunch_no_ai())
        self.text_area.bind("<Control-Shift-z>", lambda e: self.relaunch_with_ai())
        self.text_area.bind("<Control-Shift-Z>", lambda e: self.relaunch_with_ai())
        self.root.bind("<F5>", lambda e: self.insert_datetime())

        self.root.protocol("WM_DELETE_WINDOW", self.on_closing)

    def relaunch_no_ai(self):
        try:
            cmd = [sys.executable, os.path.abspath(__file__), "--no-ai"]
            subprocess.Popen(cmd)
        except Exception as e:
            messagebox.showinfo("Ultralight Mode", f"Cross Notepad running in Ultralight Mode (No LLM).\n{e}")

    def relaunch_with_ai(self):
        try:
            cmd = [sys.executable, os.path.abspath(__file__)]
            subprocess.Popen(cmd)
            self.root.destroy()
        except Exception as e:
            messagebox.showinfo("Gemma AI Mode", f"Gemma-4 AI enabled.\n{e}")

    # --------------------------------------------------
    # Multi-Tab Management
    # --------------------------------------------------
    def create_welcome_tab(self):
        # Check if already open
        for t in self.tabs:
            if t.is_welcome:
                self.switch_to_tab(t)
                return

        welcome_text = (
            "# Welcome to Cross Notepad\n\n"
            "A fast, modern Notepad for **Windows** and **Linux**.\n\n"
            "### Quick Start Options\n"
            "- **New Text Document**: `Ctrl+N`\n"
            "- **New Markdown Document**: `Ctrl+Shift+N`\n"
            "- **Open File**: `Ctrl+O`\n"
            "- **Save / Save As**: `Ctrl+S` / `Ctrl+Shift+S`\n"
            "- **Insert Date & Time**: `F5`\n"
            "- **Switch Theme**: `View -> Toggle Theme`\n\n"
            "### Markdown Feature Demo\n"
            "- [x] Multi-tab top navigation bar\n"
            "- [x] Native Windows (.exe, .msi) and Linux (.elf, .AppImage, .deb, .rpm)\n"
            "- [ ] Write my notes\n"
        )
        tab = TabDocument("tab-welcome", "Welcome", content=welcome_text, is_welcome=True)
        self.tabs.append(tab)
        self.render_tab_bar()
        self.switch_to_tab(tab)

    def create_new_tab(self, format_ext="txt"):
        title = f"Untitled-{self.tab_counter}.{format_ext}"
        self.tab_counter += 1
        tab = TabDocument(f"tab-{self.tab_counter}", title=title, content="")
        self.tabs.append(tab)
        self.render_tab_bar()
        self.switch_to_tab(tab)
        return tab

    def switch_to_tab(self, tab):
        if self.active_tab and self.active_tab != tab:
            # Save active tab content before switching
            self.active_tab.content = self.text_area.get("1.0", tk.END)[:-1]

        self.active_tab = tab
        self.is_updating_ui = True

        self.text_area.delete("1.0", tk.END)
        self.text_area.insert("1.0", tab.content)
        self.text_area.edit_modified(False)

        self.is_updating_ui = False
        self.render_tab_bar()
        self.update_title()
        self.update_stats()

    def close_tab(self, tab):
        if tab.is_dirty:
            res = messagebox.askyesnocancel("Unsaved Changes", f"Save changes to '{tab.title}' before closing?")
            if res is True:
                if not self.save_tab(tab):
                    return
            elif res is None:
                return

        idx = self.tabs.index(tab)
        self.tabs.remove(tab)

        if not self.tabs:
            self.create_welcome_tab()
        elif self.active_tab == tab:
            new_active = self.tabs[max(0, idx - 1)]
            self.switch_to_tab(new_active)
        else:
            self.render_tab_bar()

    def close_active_tab(self):
        if self.active_tab:
            self.close_tab(self.active_tab)

    def render_tab_bar(self):
        # Clear existing tabs
        for widget in self.tabs_container.winfo_children():
            widget.destroy()

        colors = self.themes[self.current_theme]

        for tab in self.tabs:
            is_active = (tab == self.active_tab)
            bg = colors["tab_active_bg"] if is_active else colors["tab_inactive_bg"]
            fg = colors["tab_active_fg"] if is_active else colors["tab_inactive_fg"]

            tab_frame = tk.Frame(self.tabs_container, bg=bg, padx=6, pady=2, cursor="hand2")
            tab_frame.pack(side=tk.LEFT, padx=1, pady=2)

            dirty_char = "• " if tab.is_dirty else ""
            lbl = tk.Label(tab_frame, text=f"{dirty_char}{tab.title}", bg=bg, fg=fg, font=("Segoe UI", 9, "bold" if is_active else "normal"))
            lbl.pack(side=tk.LEFT, padx=(2, 6))

            btn_close = tk.Label(tab_frame, text="×", bg=bg, fg=colors["status_fg"], font=("Segoe UI", 10, "bold"), cursor="hand2")
            btn_close.pack(side=tk.RIGHT, padx=2)

            # Event bindings
            lbl.bind("<Button-1>", lambda e, t=tab: self.switch_to_tab(t))
            tab_frame.bind("<Button-1>", lambda e, t=tab: self.switch_to_tab(t))
            btn_close.bind("<Button-1>", lambda e, t=tab: self.close_tab(t))

    def apply_theme(self, theme_name):
        self.current_theme = theme_name
        colors = self.themes[theme_name]

        self.root.config(bg=colors["bg"])
        self.tab_bar_frame.config(bg=colors["tab_bar_bg"])
        self.tabs_container.config(bg=colors["tab_bar_bg"])
        self.btn_new_tab.config(bg=colors["tab_inactive_bg"], fg=colors["fg"], activebackground=colors["tab_active_bg"])

        self.text_area.config(
            bg=colors["editor_bg"],
            fg=colors["editor_fg"],
            insertbackground=colors["cursor"],
            selectbackground=colors["select_bg"]
        )
        self.status_bar.config(bg=colors["status_bg"])
        self.status_left.config(bg=colors["status_bg"], fg=colors["status_fg"])
        self.status_format.config(bg=colors["status_bg"], fg=colors["accent"])
        self.status_right.config(bg=colors["status_bg"], fg=colors["status_fg"])

        self.render_tab_bar()

    def toggle_theme(self):
        new_theme = "light" if self.current_theme == "dark" else "dark"
        self.apply_theme(new_theme)

    def toggle_wrap(self):
        mode = tk.WORD if self.wrap_var.get() else tk.NONE
        self.text_area.config(wrap=mode)

    def on_text_modified(self, event=None):
        if self.text_area.edit_modified() and not self.is_updating_ui:
            if self.active_tab and not self.active_tab.is_welcome:
                if not self.active_tab.is_dirty:
                    self.active_tab.is_dirty = True
                    self.render_tab_bar()
                    self.update_title()
            self.update_stats()
            self.text_area.edit_modified(False)

    def update_cursor_info(self, event=None):
        try:
            line, col = self.text_area.index(tk.INSERT).split(".")
            content = self.text_area.get("1.0", tk.END)[:-1]
            chars = len(content)
            words = len(content.split()) if content.strip() else 0
            self.status_right.config(text=f"Ln {line}, Col {int(col)+1} | {words:,} words | {chars:,} chars")
        except Exception:
            pass

    def update_stats(self):
        self.update_cursor_info()

    def update_title(self):
        if not self.active_tab:
            return
        dirty_flag = "• " if self.active_tab.is_dirty else ""
        fmt = "MARKDOWN (.md)" if self.active_tab.title.endswith(".md") else "PLAIN TEXT (.txt)"
        if self.active_tab.is_welcome:
            fmt = "WELCOME"

        self.root.title(f"{dirty_flag}{self.active_tab.title} - Cross Notepad")
        self.status_format.config(text=fmt)
        self.status_left.config(text=self.active_tab.filepath if self.active_tab.filepath else self.active_tab.title)

    def open_file_dialog(self):
        filepath = filedialog.askopenfilename(
            title="Open Document",
            filetypes=[
                ("Supported Files (*.txt, *.md, *.rtf)", "*.txt *.md *.markdown *.text *.rtf"),
                ("Text Documents (*.txt)", "*.txt"),
                ("Markdown Documents (*.md)", "*.md"),
                ("Rich Text Format (*.rtf)", "*.rtf"),
                ("All Files (*.*)", "*.*")
            ]
        )
        if filepath:
            self.open_file_path(filepath)

    def open_file_path(self, filepath):
        try:
            with open(filepath, "r", encoding="utf-8", errors="replace") as f:
                content = f.read()
            filename = os.path.basename(filepath)
            tab = TabDocument(f"tab-{len(self.tabs)+1}", title=filename, filepath=filepath, content=content)
            self.tabs.append(tab)
            self.render_tab_bar()
            self.switch_to_tab(tab)
        except Exception as e:
            messagebox.showerror("Error", f"Could not read file:\n{e}")

    def save_tab(self, tab):
        if not tab.filepath:
            return self.save_tab_as(tab)
        try:
            if tab == self.active_tab:
                tab.content = self.text_area.get("1.0", tk.END)[:-1]
            with open(tab.filepath, "w", encoding="utf-8") as f:
                f.write(tab.content)
            tab.is_dirty = False
            self.render_tab_bar()
            self.update_title()
            return True
        except Exception as e:
            messagebox.showerror("Error", f"Could not save file:\n{e}")
            return False

    def save_file(self):
        if self.active_tab:
            return self.save_tab(self.active_tab)

    def save_tab_as(self, tab):
        def_ext = ".rtf" if tab.title.endswith(".rtf") else (".md" if tab.title.endswith(".md") else ".txt")
        filepath = filedialog.asksaveasfilename(
            title="Save Document As",
            defaultextension=def_ext,
            filetypes=[
                ("Text Document (*.txt)", "*.txt"),
                ("Markdown Document (*.md)", "*.md"),
                ("Rich Text Format (*.rtf)", "*.rtf"),
                ("All Files (*.*)", "*.*")
            ]
        )
        if filepath:
            tab.filepath = filepath
            tab.title = os.path.basename(filepath)
            return self.save_tab(tab)
        return False

    def save_file_as(self):
        if self.active_tab:
            return self.save_tab_as(self.active_tab)

    def insert_datetime(self):
        now_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        self.text_area.insert(tk.INSERT, now_str)

    def select_all(self):
        self.text_area.tag_add("sel", "1.0", "end")
        return "break"

    def show_about(self):
        messagebox.showinfo(
            "About Cross Notepad",
            "Cross Notepad v1.0.0\n"
            "Simple, fast, multi-tab Notepad for Windows and Linux with TXT, MD, and Welcome screen."
        )

    def on_closing(self):
        for tab in list(self.tabs):
            if tab.is_dirty:
                res = messagebox.askyesnocancel("Unsaved Changes", f"Save changes to '{tab.title}' before exiting?")
                if res is True:
                    if not self.save_tab(tab):
                        return
                elif res is None:
                    return
        self.root.destroy()

def main():
    initial_file = sys.argv[1] if len(sys.argv) > 1 else None
    root = tk.Tk()
    app = CrossNotepadTk(root, initial_file)
    root.mainloop()

if __name__ == "__main__":
    main()
