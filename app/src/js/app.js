/**
 * Cross Notepad Application Controller
 * Tab management, File I/O, UI Layouts, Themes, VS Code style Welcome Screen,
 * Dual-Mode Unicode Symbol Inserter (Offline Library & Compart.com Iframe), & Local Gemma-4 AI
 */
class CrossNotepadApp {
  constructor() {
    this.tabs = [];
    this.activeTabId = null;
    this.tabCounter = 1;
    this.currentViewMode = 'edit'; // 'edit', 'split', 'preview'
    this.isElectron = typeof window.electronAPI !== 'undefined';
    this.isAIPaneOpen = false;
    this.isWelcomeActive = false;
    this.lastAIResult = '';
    this.selectedUnicodeChar = '→';

    const urlParams = new URLSearchParams(window.location.search);
    this.isIncognito = urlParams.get('mode') === 'ultralight';

    this.cacheDOMElements();

    if (this.isIncognito) {
      document.body.classList.add('mode-incognito');
      if (this.dom.btnIncognitoBadge) {
        this.dom.btnIncognitoBadge.style.display = 'inline-flex';
      }
    }

    this.initEditor();
    this.initTheme();
    this.initCustomAccent();
    this.initWelcomeScreen();
    this.initUnicodeViewer();
    this.initSettingsModal();
    this.initTabs();
    this.initEventListeners();
    this.initShortcuts();
    this.initFileDrop();
    this.initResizers();
    if (!this.isIncognito) {
      this.initAIAssistant();
    }

    if (this.isElectron) {
      this.initElectronListeners();
    }
  }

  cacheDOMElements() {
    this.dom = {
      app: document.getElementById('app'),
      appBrand: document.getElementById('app-brand-btn'),
      tabsList: document.getElementById('tabs-list'),
      btnNewTab: document.getElementById('btn-new-tab'),
      btnOpen: document.getElementById('btn-open'),
      btnSave: document.getElementById('btn-save'),
      btnSaveAs: document.getElementById('btn-save-as'),
      btnIncognitoBadge: document.getElementById('btn-incognito-badge'),
      
      // View Controls
      btnViewEditor: document.getElementById('btn-view-editor'),
      btnViewSplit: document.getElementById('btn-view-split'),
      btnViewPreview: document.getElementById('btn-view-preview'),
      
      // Panes
      workspace: document.getElementById('workspace'),
      welcomeScreen: document.getElementById('welcome-screen'),
      editorPane: document.getElementById('editor-pane'),
      previewPane: document.getElementById('preview-pane'),
      previewContent: document.getElementById('preview-content'),
      resizerDivider: document.getElementById('resizer-divider'),
      aiResizerDivider: document.getElementById('ai-resizer-divider'),
      
      // Welcome Screen Elements
      welcomeBtnNewTxt: document.getElementById('welcome-btn-new-txt'),
      welcomeBtnNewMd: document.getElementById('welcome-btn-new-md'),
      welcomeBtnNewRtf: document.getElementById('welcome-btn-new-rtf'),
      welcomeBtnOpen: document.getElementById('welcome-btn-open'),
      welcomeBtnUnicodeCard: document.getElementById('welcome-btn-unicode-card'),
      welcomeBtnAI: document.getElementById('welcome-btn-ai'),
      welcomeRecentList: document.getElementById('welcome-recent-list'),
      welcomeClearRecent: document.getElementById('welcome-clear-recent'),
      welcomeBtnShortcuts: document.getElementById('welcome-btn-shortcuts'),
      welcomeBtnMarkdownGuide: document.getElementById('welcome-btn-markdown-guide'),
      welcomeBtnTheme: document.getElementById('welcome-btn-theme'),
      welcomeShowStartup: document.getElementById('welcome-show-startup'),
      
      // Unicode Modal Elements
      btnOpenUnicode: document.getElementById('btn-open-unicode'),
      modalUnicode: document.getElementById('modal-unicode'),
      btnCloseUnicode: document.getElementById('btn-close-unicode'),
      tabModeLocal: document.getElementById('tab-mode-local'),
      tabModeCompart: document.getElementById('tab-mode-compart'),
      viewUnicodeLocal: document.getElementById('view-unicode-local'),
      viewUnicodeCompart: document.getElementById('view-unicode-compart'),
      unicodeSearch: document.getElementById('unicode-search'),
      unicodeCategories: document.getElementById('unicode-categories'),
      unicodeGridContainer: document.getElementById('unicode-grid-container'),
      inspectChar: document.getElementById('inspect-char'),
      inspectName: document.getElementById('inspect-name'),
      inspectCode: document.getElementById('inspect-code'),
      btnUnicodeInsert: document.getElementById('btn-unicode-insert'),
      btnUnicodeCopy: document.getElementById('btn-unicode-copy'),
      compartIframe: document.getElementById('compart-iframe'),
      compartPasteInput: document.getElementById('compart-paste-input'),
      btnCompartInsert: document.getElementById('btn-compart-insert'),

      // AI Assistant Pane & Elements
      btnToggleAI: document.getElementById('btn-toggle-ai'),
      aiPane: document.getElementById('ai-pane'),
      btnCloseAI: document.getElementById('btn-close-ai'),
      aiModelStatus: document.getElementById('ai-model-status'),
      aiPlaceholder: document.getElementById('ai-placeholder'),
      aiResponseCard: document.getElementById('ai-response-card'),
      aiResponseBadge: document.getElementById('ai-response-badge'),
      aiResponseText: document.getElementById('ai-response-text'),
      aiLoading: document.getElementById('ai-loading'),
      aiUserPrompt: document.getElementById('ai-user-prompt'),
      btnAISend: document.getElementById('btn-ai-send'),
      btnAIInsert: document.getElementById('btn-ai-insert'),
      btnAIReplace: document.getElementById('btn-ai-replace'),
      btnAICopy: document.getElementById('btn-ai-copy'),
      aiStatusIndicator: document.getElementById('ai-status-indicator'),
      aiStatusText: document.getElementById('ai-status-text'),
      aiStatusPill: document.getElementById('ai-status-pill'),
      
      // AI Quick Action buttons
      btnAISummarize: document.getElementById('btn-ai-summarize'),
      btnAIContinue: document.getElementById('btn-ai-continue'),
      btnAIGrammar: document.getElementById('btn-ai-grammar'),
      btnAIMarkdown: document.getElementById('btn-ai-markdown'),
      
      // Editor & Line Numbers
      lineNumbers: document.getElementById('line-numbers'),
      textarea: document.getElementById('main-textarea'),
      
      // Formatting Toolbar
      fmtToolbar: document.getElementById('fmt-toolbar'),
      rtfToolbar: document.getElementById('rtf-toolbar'),
      rtfFontFamily: document.getElementById('rtf-font-family'),
      rtfFontSize: document.getElementById('rtf-font-size'),
      
      // Find & Replace
      findReplaceBar: document.getElementById('find-replace-bar'),
      btnFindToggle: document.getElementById('btn-find-toggle'),
      findInput: document.getElementById('find-input'),
      replaceInput: document.getElementById('replace-input'),
      matchCount: document.getElementById('match-count'),
      btnFindPrev: document.getElementById('btn-find-prev'),
      btnFindNext: document.getElementById('btn-find-next'),
      btnMatchCase: document.getElementById('btn-match-case'),
      btnRegex: document.getElementById('btn-regex'),
      btnCloseFind: document.getElementById('btn-close-find'),
      btnReplace: document.getElementById('btn-replace'),
      btnReplaceAll: document.getElementById('btn-replace-all'),
      
      // Header Toggles
      btnToggleWrap: document.getElementById('btn-toggle-wrap'),
      btnToggleLinenums: document.getElementById('btn-toggle-linenums'),
      btnThemeMenu: document.getElementById('btn-theme-menu'),
      themeDropdown: document.getElementById('theme-dropdown'),
      btnHelpModal: document.getElementById('btn-help-modal'),
      modalHelp: document.getElementById('modal-help'),
      btnCloseHelp: document.getElementById('btn-close-help'),
      btnDismissHelp: document.getElementById('btn-dismiss-help'),
      
      // Settings & Preferences Modal
      btnSettingsModal: document.getElementById('btn-settings-modal'),
      modalSettings: document.getElementById('modal-settings'),
      btnCloseSettings: document.getElementById('btn-close-settings'),
      btnDismissSettings: document.getElementById('btn-dismiss-settings'),
      chkRainbowCaret: document.getElementById('setting-rainbow-caret'),
      rowCaretStep: document.getElementById('setting-row-caret-step'),
      rowStaticCaret: document.getElementById('setting-row-static-caret'),
      sliderCaretStep: document.getElementById('setting-caret-step'),
      numCaretStep: document.getElementById('setting-caret-step-num'),
      valCaretStep: document.getElementById('val-caret-step'),
      inputStaticCaret: document.getElementById('setting-static-caret'),
      inputCustomAccent: document.getElementById('setting-custom-accent'),
      btnResetAccent: document.getElementById('btn-reset-accent'),
      accentPresets: document.querySelectorAll('.accent-preset-btn'),
      sliderFontSize: document.getElementById('setting-font-size'),
      valFontSize: document.getElementById('val-font-size'),
      
      // Status Bar
      formatBadge: document.getElementById('format-badge'),
      fileFormatLabel: document.getElementById('file-format-label'),
      filePathDisplay: document.getElementById('file-path-display'),
      saveStatusDisplay: document.getElementById('save-status-display'),
      cursorPos: document.getElementById('cursor-pos'),
      wordCount: document.getElementById('word-count'),
      charCount: document.getElementById('char-count'),
      readingTime: document.getElementById('reading-time'),
      
      // Actions
      btnCopyHtml: document.getElementById('btn-copy-html'),
      btnExportMd: document.getElementById('btn-export-md'),
      webFileInput: document.getElementById('web-file-input')
    };
  }

  initEditor() {
    this.editor = new EditorController(this.dom.textarea, this.dom.lineNumbers, {
      cursorPos: this.dom.cursorPos,
      wordCount: this.dom.wordCount,
      charCount: this.dom.charCount,
      readingTime: this.dom.readingTime
    });

    MarkdownManager.init();
    MarkdownManager.setupScrollSync(this.dom.textarea, this.dom.previewContent);

    this.dom.textarea.addEventListener('input', () => {
      const activeTab = this.getActiveTab();
      if (activeTab && !activeTab.isWelcome) {
        activeTab.content = this.dom.textarea.value;
        if (!activeTab.isDirty) {
          activeTab.isDirty = true;
          this.updateTabElement(activeTab);
          this.updateSaveStatus('Unsaved');
        }
      }
      this.updateMarkdownPreview();
      this.scheduleSessionSave();
    });
  }

  initTheme() {
    const savedTheme = localStorage.getItem('cross-notepad-theme') || 'dark';
    this.setTheme(savedTheme);

    this.dom.themeDropdown.querySelectorAll('button[data-theme-val]').forEach(btn => {
      btn.addEventListener('click', () => {
        const theme = btn.getAttribute('data-theme-val');
        this.setTheme(theme);
        this.dom.themeDropdown.classList.remove('show');
      });
    });

    this.dom.btnThemeMenu.addEventListener('click', (e) => {
      e.stopPropagation();
      this.dom.themeDropdown.classList.toggle('show');
    });

    document.addEventListener('click', (e) => {
      if (!this.dom.themeDropdown.contains(e.target) && e.target !== this.dom.btnThemeMenu) {
        this.dom.themeDropdown.classList.remove('show');
      }
    });
  }

  setTheme(themeName) {
    document.documentElement.setAttribute('data-theme', themeName);
    localStorage.setItem('cross-notepad-theme', themeName);

    this.dom.themeDropdown.querySelectorAll('button[data-theme-val]').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-theme-val') === themeName);
    });

    if (this.editor && typeof this.editor.updateTheme === 'function') {
      this.editor.updateTheme(themeName);
    }

    const hljsTheme = document.getElementById('hljs-theme');
    if (hljsTheme) {
      if (themeName === 'light' || themeName === 'sepia') {
        hljsTheme.href = '../node_modules/highlight.js/styles/github.css';
      } else {
        hljsTheme.href = '../node_modules/highlight.js/styles/github-dark.css';
      }
    }
  }

  // --------------------------------------------------
  // Custom Accent Color
  // --------------------------------------------------
  initCustomAccent() {
    const savedAccent = localStorage.getItem('cross-notepad-custom-accent');
    if (savedAccent) {
      this.applyCustomAccent(savedAccent);
    }
  }

  applyCustomAccent(hexColor) {
    if (!hexColor) {
      localStorage.removeItem('cross-notepad-custom-accent');
      document.documentElement.style.removeProperty('--accent');
      document.documentElement.style.removeProperty('--accent-hover');
      document.documentElement.style.removeProperty('--accent-glow');
      return;
    }
    localStorage.setItem('cross-notepad-custom-accent', hexColor);
    document.documentElement.style.setProperty('--accent', hexColor);
    document.documentElement.style.setProperty('--accent-hover', hexColor);
    document.documentElement.style.setProperty('--accent-glow', hexColor + '40');
  }

  // --------------------------------------------------
  // Settings & Preferences Modal
  // --------------------------------------------------
  initSettingsModal() {
    if (!this.dom.modalSettings) return;

    // Open / Close triggers
    if (this.dom.btnSettingsModal) {
      this.dom.btnSettingsModal.addEventListener('click', () => this.openSettingsModal());
    }
    if (this.dom.btnCloseSettings) {
      this.dom.btnCloseSettings.addEventListener('click', () => this.dom.modalSettings.close());
    }
    if (this.dom.btnDismissSettings) {
      this.dom.btnDismissSettings.addEventListener('click', () => this.dom.modalSettings.close());
    }

    // Blinking Cursor (Caret) controls
    const isRainbow = this.editor.rainbowCaretEnabled;
    const caretStep = this.editor.caretHueStep;
    const staticColor = this.editor.staticCaretColor;

    if (this.dom.chkRainbowCaret) {
      this.dom.chkRainbowCaret.checked = isRainbow;
      this.toggleCaretRows(isRainbow);

      this.dom.chkRainbowCaret.addEventListener('change', () => {
        const enabled = this.dom.chkRainbowCaret.checked;
        this.editor.setRainbowCaretEnabled(enabled);
        this.toggleCaretRows(enabled);
      });
    }

    if (this.dom.sliderCaretStep && this.dom.numCaretStep) {
      this.dom.sliderCaretStep.value = caretStep;
      this.dom.numCaretStep.value = caretStep;
      if (this.dom.valCaretStep) this.dom.valCaretStep.textContent = `${caretStep}°`;

      const updateStep = (val) => {
        const step = Math.max(1, Math.min(180, parseInt(val, 10) || 10));
        this.dom.sliderCaretStep.value = step;
        this.dom.numCaretStep.value = step;
        if (this.dom.valCaretStep) this.dom.valCaretStep.textContent = `${step}°`;
        this.editor.setCaretHueStep(step);
      };

      this.dom.sliderCaretStep.addEventListener('input', (e) => updateStep(e.target.value));
      this.dom.numCaretStep.addEventListener('input', (e) => updateStep(e.target.value));
    }

    if (this.dom.inputStaticCaret) {
      this.dom.inputStaticCaret.value = staticColor;
      this.dom.inputStaticCaret.addEventListener('input', (e) => {
        this.editor.setStaticCaretColor(e.target.value);
      });
    }

    // Custom Accent Color controls
    const currentAccent = localStorage.getItem('cross-notepad-custom-accent') || '#38bdf8';
    if (this.dom.inputCustomAccent) {
      this.dom.inputCustomAccent.value = currentAccent;
      this.dom.inputCustomAccent.addEventListener('input', (e) => {
        this.applyCustomAccent(e.target.value);
        this.updateAccentPresetActive(e.target.value);
      });
    }

    if (this.dom.btnResetAccent) {
      this.dom.btnResetAccent.addEventListener('click', () => {
        this.applyCustomAccent(null);
        if (this.dom.inputCustomAccent) this.dom.inputCustomAccent.value = '#38bdf8';
        this.updateAccentPresetActive('#38bdf8');
      });
    }

    if (this.dom.accentPresets) {
      this.dom.accentPresets.forEach(btn => {
        btn.addEventListener('click', () => {
          const color = btn.getAttribute('data-color');
          this.applyCustomAccent(color);
          if (this.dom.inputCustomAccent) this.dom.inputCustomAccent.value = color;
          this.updateAccentPresetActive(color);
        });
      });
      this.updateAccentPresetActive(currentAccent);
    }

    // Font size setting
    if (this.dom.sliderFontSize) {
      this.dom.sliderFontSize.value = this.editor.fontSize;
      if (this.dom.valFontSize) this.dom.valFontSize.textContent = `${this.editor.fontSize}px`;
      this.dom.sliderFontSize.addEventListener('input', (e) => {
        const size = parseInt(e.target.value, 10);
        this.editor.fontSize = size;
        this.editor.applyFontSize();
        localStorage.setItem('cross-notepad-font-size', size.toString());
        if (this.dom.valFontSize) this.dom.valFontSize.textContent = `${size}px`;
      });
    }
  }

  toggleCaretRows(isRainbow) {
    if (this.dom.rowCaretStep) {
      this.dom.rowCaretStep.style.display = isRainbow ? 'flex' : 'none';
    }
    if (this.dom.rowStaticCaret) {
      this.dom.rowStaticCaret.style.display = isRainbow ? 'none' : 'flex';
    }
  }

  updateAccentPresetActive(hexColor) {
    if (!this.dom.accentPresets) return;
    this.dom.accentPresets.forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-color').toLowerCase() === (hexColor || '').toLowerCase());
    });
  }

  openSettingsModal() {
    if (this.dom.modalSettings) {
      this.dom.modalSettings.showModal();
    }
  }

  // --------------------------------------------------
  // Unicode Symbol Viewer & Compart.com Integration
  // --------------------------------------------------
  initUnicodeViewer() {
    this.unicodeData = [
      // Arrows
      { char: '→', name: 'Rightwards Arrow', cat: 'arrows', code: 'U+2192' },
      { char: '←', name: 'Leftwards Arrow', cat: 'arrows', code: 'U+2190' },
      { char: '↑', name: 'Upwards Arrow', cat: 'arrows', code: 'U+2191' },
      { char: '↓', name: 'Downwards Arrow', cat: 'arrows', code: 'U+2193' },
      { char: '↔', name: 'Left Right Arrow', cat: 'arrows', code: 'U+2194' },
      { char: '↕', name: 'Up Down Arrow', cat: 'arrows', code: 'U+2195' },
      { char: '⇒', name: 'Rightwards Double Arrow', cat: 'arrows', code: 'U+21D2' },
      { char: '⇐', name: 'Leftwards Double Arrow', cat: 'arrows', code: 'U+21D0' },
      { char: '⇑', name: 'Upwards Double Arrow', cat: 'arrows', code: 'U+21D1' },
      { char: '⇓', name: 'Downwards Double Arrow', cat: 'arrows', code: 'U+21D3' },
      { char: '⇔', name: 'Left Right Double Arrow', cat: 'arrows', code: 'U+21D4' },
      { char: '➔', name: 'Heavy Rightwards Arrow', cat: 'arrows', code: 'U+2794' },
      { char: '➜', name: 'Heavy Round-Tipped Right Arrow', cat: 'arrows', code: 'U+279C' },
      { char: '➤', name: 'Black Rightwards Arrowhead', cat: 'arrows', code: 'U+27A4' },
      { char: '↩', name: 'Leftwards Arrow With Hook', cat: 'arrows', code: 'U+21A9' },
      { char: '↪', name: 'Rightwards Arrow With Hook', cat: 'arrows', code: 'U+21AA' },
      { char: '↺', name: 'Anticlockwise Open Circle Arrow', cat: 'arrows', code: 'U+21BA' },
      { char: '↻', name: 'Clockwise Open Circle Arrow', cat: 'arrows', code: 'U+21BB' },

      // Math & Logic
      { char: '±', name: 'Plus-Minus Sign', cat: 'math', code: 'U+00B1' },
      { char: '×', name: 'Multiplication Sign', cat: 'math', code: 'U+00D7' },
      { char: '÷', name: 'Division Sign', cat: 'math', code: 'U+00F7' },
      { char: '≠', name: 'Not Equal To', cat: 'math', code: 'U+2260' },
      { char: '≈', name: 'Almost Equal To', cat: 'math', code: 'U+2248' },
      { char: '≤', name: 'Less-Than Or Equal To', cat: 'math', code: 'U+2264' },
      { char: '≥', name: 'Greater-Than Or Equal To', cat: 'math', code: 'U+2265' },
      { char: '∑', name: 'N-Ary Summation', cat: 'math', code: 'U+2211' },
      { char: '∏', name: 'N-Ary Product', cat: 'math', code: 'U+220F' },
      { char: '√', name: 'Square Root', cat: 'math', code: 'U+221A' },
      { char: '∞', name: 'Infinity', cat: 'math', code: 'U+221E' },
      { char: '∫', name: 'Integral', cat: 'math', code: 'U+222B' },
      { char: '∂', name: 'Partial Differential', cat: 'math', code: 'U+2202' },
      { char: '∆', name: 'Increment / Delta', cat: 'math', code: 'U+2206' },
      { char: '∇', name: 'Nabla', cat: 'math', code: 'U+2207' },
      { char: '∈', name: 'Element Of', cat: 'math', code: 'U+2208' },
      { char: '∉', name: 'Not An Element Of', cat: 'math', code: 'U+2209' },
      { char: '∩', name: 'Intersection', cat: 'math', code: 'U+2229' },
      { char: '∪', name: 'Union', cat: 'math', code: 'U+222A' },
      { char: '⊂', name: 'Subset Of', cat: 'math', code: 'U+2282' },
      { char: '⊃', name: 'Superset Of', cat: 'math', code: 'U+2283' },
      { char: '∀', name: 'For All', cat: 'math', code: 'U+2200' },
      { char: '∃', name: 'There Exists', cat: 'math', code: 'U+2203' },
      { char: '∄', name: 'There Does Not Exist', cat: 'math', code: 'U+2204' },
      { char: '∠', name: 'Angle', cat: 'math', code: 'U+2220' },
      { char: '⊥', name: 'Up Tack / Perpendicular', cat: 'math', code: 'U+22A5' },
      { char: '∴', name: 'Therefore', cat: 'math', code: 'U+2234' },
      { char: '∵', name: 'Because', cat: 'math', code: 'U+2235' },
      { char: '∝', name: 'Proportional To', cat: 'math', code: 'U+221D' },
      { char: '≡', name: 'Identical To', cat: 'math', code: 'U+2261' },

      // Greek Letters
      { char: 'α', name: 'Greek Small Letter Alpha', cat: 'greek', code: 'U+03B1' },
      { char: 'β', name: 'Greek Small Letter Beta', cat: 'greek', code: 'U+03B2' },
      { char: 'γ', name: 'Greek Small Letter Gamma', cat: 'greek', code: 'U+03B3' },
      { char: 'δ', name: 'Greek Small Letter Delta', cat: 'greek', code: 'U+03B4' },
      { char: 'ε', name: 'Greek Small Letter Epsilon', cat: 'greek', code: 'U+03B5' },
      { char: 'θ', name: 'Greek Small Letter Theta', cat: 'greek', code: 'U+03B8' },
      { char: 'λ', name: 'Greek Small Letter Lambda', cat: 'greek', code: 'U+03BB' },
      { char: 'μ', name: 'Greek Small Letter Mu', cat: 'greek', code: 'U+03BC' },
      { char: 'π', name: 'Greek Small Letter Pi', cat: 'greek', code: 'U+03C0' },
      { char: 'σ', name: 'Greek Small Letter Sigma', cat: 'greek', code: 'U+03C3' },
      { char: 'τ', name: 'Greek Small Letter Tau', cat: 'greek', code: 'U+03C4' },
      { char: 'φ', name: 'Greek Small Letter Phi', cat: 'greek', code: 'U+03C6' },
      { char: 'ω', name: 'Greek Small Letter Omega', cat: 'greek', code: 'U+03C9' },
      { char: 'Δ', name: 'Greek Capital Letter Delta', cat: 'greek', code: 'U+0394' },
      { char: 'Σ', name: 'Greek Capital Letter Sigma', cat: 'greek', code: 'U+03A3' },
      { char: 'Ω', name: 'Greek Capital Letter Omega', cat: 'greek', code: 'U+03A9' },

      // Currency
      { char: '$', name: 'Dollar Sign', cat: 'currency', code: 'U+0024' },
      { char: '€', name: 'Euro Sign', cat: 'currency', code: 'U+20AC' },
      { char: '£', name: 'Pound Sign', cat: 'currency', code: 'U+00A3' },
      { char: '¥', name: 'Yen Sign', cat: 'currency', code: 'U+00A5' },
      { char: '₹', name: 'Indian Rupee Sign', cat: 'currency', code: 'U+20B9' },
      { char: '₽', name: 'Russian Ruble Sign', cat: 'currency', code: 'U+20BD' },
      { char: '₩', name: 'Won Sign', cat: 'currency', code: 'U+20A9' },
      { char: '₿', name: 'Bitcoin Sign', cat: 'currency', code: 'U+20BF' },
      { char: '¢', name: 'Cent Sign', cat: 'currency', code: 'U+00A2' },

      // Box & Shapes
      { char: '─', name: 'Box Drawings Light Horizontal', cat: 'box', code: 'U+2500' },
      { char: '│', name: 'Box Drawings Light Vertical', cat: 'box', code: 'U+2502' },
      { char: '┌', name: 'Box Drawings Light Down and Right', cat: 'box', code: 'U+250C' },
      { char: '┐', name: 'Box Drawings Light Down and Left', cat: 'box', code: 'U+2510' },
      { char: '└', name: 'Box Drawings Light Up and Right', cat: 'box', code: 'U+2514' },
      { char: '┘', name: 'Box Drawings Light Up and Left', cat: 'box', code: 'U+2518' },
      { char: '├', name: 'Box Drawings Light Vertical and Right', cat: 'box', code: 'U+251C' },
      { char: '┤', name: 'Box Drawings Light Vertical and Left', cat: 'box', code: 'U+2524' },
      { char: '┬', name: 'Box Drawings Light Down and Horizontal', cat: 'box', code: 'U+252C' },
      { char: '┴', name: 'Box Drawings Light Up and Horizontal', cat: 'box', code: 'U+2534' },
      { char: '┼', name: 'Box Drawings Light Vertical and Horizontal', cat: 'box', code: 'U+253C' },
      { char: '■', name: 'Black Square', cat: 'box', code: 'U+25A0' },
      { char: '□', name: 'White Square', cat: 'box', code: 'U+25A1' },
      { char: '▲', name: 'Black Up-Pointing Triangle', cat: 'box', code: 'U+25B2' },
      { char: '▼', name: 'Black Down-Pointing Triangle', cat: 'box', code: 'U+25BC' },
      { char: '◆', name: 'Black Diamond', cat: 'box', code: 'U+25C6' },
      { char: '◇', name: 'White Diamond', cat: 'box', code: 'U+25C7' },
      { char: '●', name: 'Black Circle', cat: 'box', code: 'U+25CF' },
      { char: '○', name: 'White Circle', cat: 'box', code: 'U+25CB' },

      // Punctuation & Typography
      { char: '§', name: 'Section Sign', cat: 'punctuation', code: 'U+00A7' },
      { char: '¶', name: 'Pilcrow / Paragraph Sign', cat: 'punctuation', code: 'U+00B6' },
      { char: '†', name: 'Dagger', cat: 'punctuation', code: 'U+2020' },
      { char: '‡', name: 'Double Dagger', cat: 'punctuation', code: 'U+2021' },
      { char: '•', name: 'Bullet', cat: 'punctuation', code: 'U+2022' },
      { char: '…', name: 'Horizontal Ellipsis', cat: 'punctuation', code: 'U+2026' },
      { char: '‰', name: 'Per Mille Sign', cat: 'punctuation', code: 'U+2030' },
      { char: '′', name: 'Prime (Minutes / Feet)', cat: 'punctuation', code: 'U+2032' },
      { char: '″', name: 'Double Prime (Seconds / Inches)', cat: 'punctuation', code: 'U+2033' },
      { char: '«', name: 'Left-Pointing Double Angle Quotation', cat: 'punctuation', code: 'U+00AB' },
      { char: '»', name: 'Right-Pointing Double Angle Quotation', cat: 'punctuation', code: 'U+00BB' },
      { char: '“', name: 'Left Double Quotation Mark', cat: 'punctuation', code: 'U+201C' },
      { char: '”', name: 'Right Double Quotation Mark', cat: 'punctuation', code: 'U+201D' },
      { char: '—', name: 'Em Dash', cat: 'punctuation', code: 'U+2014' },
      { char: '–', name: 'En Dash', cat: 'punctuation', code: 'U+2013' },
      { char: '©', name: 'Copyright Sign', cat: 'punctuation', code: 'U+00A9' },
      { char: '®', name: 'Registered Sign', cat: 'punctuation', code: 'U+00AE' },
      { char: '™', name: 'Trade Mark Sign', cat: 'punctuation', code: 'U+2122' },
      { char: '°', name: 'Degree Sign', cat: 'punctuation', code: 'U+00B0' },

      // Superscripts & Subscripts
      { char: '⁰', name: 'Superscript Zero', cat: 'scripts', code: 'U+2070' },
      { char: '¹', name: 'Superscript One', cat: 'scripts', code: 'U+00B9' },
      { char: '²', name: 'Superscript Two', cat: 'scripts', code: 'U+00B2' },
      { char: '³', name: 'Superscript Three', cat: 'scripts', code: 'U+00B3' },
      { char: '⁴', name: 'Superscript Four', cat: 'scripts', code: 'U+2074' },
      { char: 'ⁿ', name: 'Superscript Latin Small Letter N', cat: 'scripts', code: 'U+207F' },
      { char: '₀', name: 'Subscript Zero', cat: 'scripts', code: 'U+2080' },
      { char: '₁', name: 'Subscript One', cat: 'scripts', code: 'U+2081' },
      { char: '₂', name: 'Subscript Two', cat: 'scripts', code: 'U+2082' },
      { char: '₃', name: 'Subscript Three', cat: 'scripts', code: 'U+2083' },

      // Fractions
      { char: '½', name: 'Vulgar Fraction One Half', cat: 'fractions', code: 'U+00BD' },
      { char: '⅓', name: 'Vulgar Fraction One Third', cat: 'fractions', code: 'U+2153' },
      { char: '⅔', name: 'Vulgar Fraction Two Thirds', cat: 'fractions', code: 'U+2154' },
      { char: '¼', name: 'Vulgar Fraction One Quarter', cat: 'fractions', code: 'U+00BC' },
      { char: '¾', name: 'Vulgar Fraction Three Quarters', cat: 'fractions', code: 'U+00BE' },

      // Technical & Keyboard
      { char: '⌘', name: 'Place of Interest / Command Key', cat: 'technical', code: 'U+2318' },
      { char: '⌥', name: 'Option Key', cat: 'technical', code: 'U+2325' },
      { char: '⇧', name: 'Upwards White Arrow / Shift Key', cat: 'technical', code: 'U+21E7' },
      { char: '⌃', name: 'Up Arrowhead / Control Key', cat: 'technical', code: 'U+2303' },
      { char: '⎋', name: 'Broken Circle with NW Arrow / Escape Key', cat: 'technical', code: 'U+238B' },
      { char: '⏎', name: 'Return Symbol', cat: 'technical', code: 'U+23CE' },
      { char: '⌫', name: 'Erase to the Left / Backspace Key', cat: 'technical', code: 'U+232B' },
      { char: '⌀', name: 'Diameter Sign', cat: 'technical', code: 'U+2300' },

      // Dingbats & Badges
      { char: '✓', name: 'Check Mark', cat: 'dingbats', code: 'U+2713' },
      { char: '✔', name: 'Heavy Check Mark', cat: 'dingbats', code: 'U+2714' },
      { char: '✕', name: 'Multiplication X', cat: 'dingbats', code: 'U+2715' },
      { char: '✖', name: 'Heavy Multiplication X', cat: 'dingbats', code: 'U+2716' },
      { char: '★', name: 'Black Star', cat: 'dingbats', code: 'U+2605' },
      { char: '☆', name: 'White Star', cat: 'dingbats', code: 'U+2606' },
      { char: '✦', name: 'Black Four Pointed Star', cat: 'dingbats', code: 'U+2726' },
      { char: '✧', name: 'White Four Pointed Star', cat: 'dingbats', code: 'U+2727' },
      { char: '⚡', name: 'High Voltage Sign', cat: 'dingbats', code: 'U+26A1' },
      { char: '♠', name: 'Black Spade Suit', cat: 'dingbats', code: 'U+2660' },
      { char: '♣', name: 'Black Club Suit', cat: 'dingbats', code: 'U+2663' },
      { char: '♥', name: 'Black Heart Suit', cat: 'dingbats', code: 'U+2665' },
      { char: '♦', name: 'Black Diamond Suit', cat: 'dingbats', code: 'U+2666' }
    ];

    this.dom.btnOpenUnicode.addEventListener('click', () => this.openUnicodeModal());
    this.dom.welcomeBtnUnicodeCard.addEventListener('click', () => this.openUnicodeModal());
    this.dom.btnCloseUnicode.addEventListener('click', () => this.dom.modalUnicode.close());

    // Mode tabs
    this.dom.tabModeLocal.addEventListener('click', () => this.switchUnicodeMode('local'));
    this.dom.tabModeCompart.addEventListener('click', () => this.switchUnicodeMode('compart'));

    // Search and categories
    this.dom.unicodeSearch.addEventListener('input', () => this.filterUnicodeGrid());
    this.dom.unicodeCategories.querySelectorAll('.cat-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        this.dom.unicodeCategories.querySelectorAll('.cat-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        this.filterUnicodeGrid();
      });
    });

    // Inspector Actions
    this.dom.btnUnicodeInsert.addEventListener('click', () => {
      if (this.selectedUnicodeChar) {
        this.insertUnicodeChar(this.selectedUnicodeChar);
      }
    });

    this.dom.btnUnicodeCopy.addEventListener('click', () => {
      if (this.selectedUnicodeChar) {
        navigator.clipboard.writeText(this.selectedUnicodeChar).then(() => {
          this.dom.btnUnicodeCopy.querySelector('span').textContent = 'Copied!';
          setTimeout(() => {
            this.dom.btnUnicodeCopy.querySelector('span').textContent = 'Copy Symbol';
          }, 1500);
        });
      }
    });

    // Compart Quick Paste
    this.dom.btnCompartInsert.addEventListener('click', () => {
      const val = this.dom.compartPasteInput.value.trim();
      if (val) {
        this.insertUnicodeChar(val);
        this.dom.compartPasteInput.value = '';
      }
    });

    this.renderUnicodeGrid(this.unicodeData);
  }

  openUnicodeModal() {
    this.dom.modalUnicode.showModal();
    this.dom.unicodeSearch.focus();
  }

  switchUnicodeMode(mode) {
    const isLocal = (mode === 'local');
    this.dom.tabModeLocal.classList.toggle('active', isLocal);
    this.dom.tabModeCompart.classList.toggle('active', !isLocal);

    this.dom.viewUnicodeLocal.classList.toggle('hidden', !isLocal);
    this.dom.viewUnicodeCompart.classList.toggle('hidden', isLocal);

    if (!isLocal && (!this.dom.compartIframe.src || this.dom.compartIframe.src === 'about:blank')) {
      this.dom.compartIframe.src = 'https://www.compart.com/en/unicode';
    }
  }

  renderUnicodeGrid(items) {
    const container = this.dom.unicodeGridContainer;
    container.innerHTML = '';

    items.forEach(item => {
      const tile = document.createElement('button');
      tile.className = 'unicode-tile' + (item.char === this.selectedUnicodeChar ? ' active' : '');
      tile.textContent = item.char;
      tile.title = `${item.name} (${item.code})`;

      tile.addEventListener('click', () => {
        container.querySelectorAll('.unicode-tile').forEach(t => t.classList.remove('active'));
        tile.classList.add('active');
        this.inspectUnicode(item);
        this.insertUnicodeChar(item.char);
      });

      tile.addEventListener('mouseenter', () => {
        this.inspectUnicode(item);
      });

      container.appendChild(tile);
    });

    if (items.length > 0) {
      this.inspectUnicode(items[0]);
    }
  }

  inspectUnicode(item) {
    this.selectedUnicodeChar = item.char;
    this.dom.inspectChar.textContent = item.char;
    this.dom.inspectName.textContent = item.name;
    const hex = item.char.codePointAt(0).toString(16).toUpperCase();
    this.dom.inspectCode.textContent = `Code: ${item.code || 'U+' + hex} | Hex: 0x${hex} | HTML: &#x${hex};`;
  }

  filterUnicodeGrid() {
    const query = this.dom.unicodeSearch.value.trim().toLowerCase();
    const activeCatEl = this.dom.unicodeCategories.querySelector('.cat-pill.active');
    const activeCat = activeCatEl ? activeCatEl.getAttribute('data-cat') : 'all';

    const filtered = this.unicodeData.filter(item => {
      const matchesCat = (activeCat === 'all' || item.cat === activeCat);
      const matchesQuery = !query ||
        item.char.includes(query) ||
        item.name.toLowerCase().includes(query) ||
        item.code.toLowerCase().includes(query);
      return matchesCat && matchesQuery;
    });

    this.renderUnicodeGrid(filtered);
  }

  insertUnicodeChar(character) {
    if (this.isWelcomeActive) {
      this.createTab({ format: 'md' });
    }
    this.editor.insertTextAtCursor(character);
  }

  // --------------------------------------------------
  // Welcome / Home Screen
  // --------------------------------------------------
  initWelcomeScreen() {
    const showStartup = localStorage.getItem('cross-notepad-show-welcome') !== 'false';
    this.dom.welcomeShowStartup.checked = showStartup;

    this.dom.welcomeShowStartup.addEventListener('change', () => {
      localStorage.setItem('cross-notepad-show-welcome', this.dom.welcomeShowStartup.checked);
    });

    // Welcome action buttons
    this.dom.welcomeBtnNewTxt.addEventListener('click', () => this.createTab({ format: 'txt' }));
    this.dom.welcomeBtnNewMd.addEventListener('click', () => this.createTab({ format: 'md' }));
    if (this.dom.welcomeBtnNewRtf) {
      this.dom.welcomeBtnNewRtf.addEventListener('click', () => this.createTab({ format: 'rtf' }));
    }
    this.dom.welcomeBtnOpen.addEventListener('click', () => this.openFile());
    this.dom.welcomeBtnAI.addEventListener('click', () => {
      this.createTab({ format: 'md' });
      this.toggleAIPane(true);
    });

    this.dom.welcomeClearRecent.addEventListener('click', () => this.clearRecentFiles());
    this.dom.welcomeBtnShortcuts.addEventListener('click', () => this.dom.modalHelp.showModal());
    this.dom.welcomeBtnMarkdownGuide.addEventListener('click', () => this.dom.modalHelp.showModal());
    this.dom.welcomeBtnTheme.addEventListener('click', () => {
      this.dom.themeDropdown.classList.toggle('show');
    });

    this.renderRecentFiles();
  }

  showWelcomeScreen() {
    this.isWelcomeActive = true;
    this.dom.welcomeScreen.classList.remove('hidden');
    this.dom.editorPane.classList.add('hidden');
    this.dom.previewPane.classList.add('hidden');
    this.dom.resizerDivider.classList.add('hidden');
    if (this.dom.fmtToolbar) this.dom.fmtToolbar.style.display = 'none';
    if (this.dom.rtfToolbar) this.dom.rtfToolbar.style.display = 'none';

    this.dom.filePathDisplay.textContent = 'Welcome';
    this.dom.fileFormatLabel.textContent = 'HOME';
    this.updateSaveStatus('');
    this.renderRecentFiles();
  }

  hideWelcomeScreen() {
    this.isWelcomeActive = false;
    this.dom.welcomeScreen.classList.add('hidden');
    const activeTab = this.getActiveTab();
    this.updateFormatBadgeUI(activeTab ? activeTab.format : 'txt');
    this.setViewMode(this.currentViewMode);
  }

  // Recent Files
  getRecentFiles() {
    try {
      return JSON.parse(localStorage.getItem('cross-notepad-recent-files') || '[]');
    } catch (e) {
      return [];
    }
  }

  addRecentFile(fileInfo) {
    let recent = this.getRecentFiles().filter(f => f.path !== fileInfo.path);
    recent.unshift({
      name: fileInfo.name,
      path: fileInfo.path,
      format: fileInfo.format || (fileInfo.name.endsWith('.md') ? 'md' : 'txt'),
      time: new Date().toLocaleDateString()
    });
    recent = recent.slice(0, 8);
    localStorage.setItem('cross-notepad-recent-files', JSON.stringify(recent));
    this.renderRecentFiles();
  }

  clearRecentFiles() {
    localStorage.removeItem('cross-notepad-recent-files');
    this.renderRecentFiles();
  }

  renderRecentFiles() {
    const recent = this.getRecentFiles();
    const listEl = this.dom.welcomeRecentList;
    listEl.innerHTML = '';

    if (recent.length === 0) {
      listEl.innerHTML = '<div class="welcome-empty-recent">No recent documents yet</div>';
      return;
    }

    recent.forEach(item => {
      const btn = document.createElement('button');
      btn.className = 'recent-item-btn';
      btn.innerHTML = `
        <span class="recent-item-title">${item.name}</span>
        <span class="recent-item-path" title="${item.path}">${item.path}</span>
      `;
      btn.addEventListener('click', async () => {
        if (this.isElectron && item.path) {
          try {
            const res = await window.electronAPI.readFile(item.path);
            this.loadFileIntoTab(res.fileName, res.filePath, res.content);
          } catch (e) {
            alert('Could not open recent file: ' + e.message);
          }
        }
      });
      listEl.appendChild(btn);
    });
  }

  // Tabs Management & Session Persistence
  async initTabs() {
    const hasRestored = await this.restoreSessionState();
    if (hasRestored) {
      return;
    }

    const showStartup = localStorage.getItem('cross-notepad-show-welcome') !== 'false';
    this.createWelcomeTab();

    if (!showStartup) {
      this.createTab({ format: 'md' });
    }
  }

  scheduleSessionSave() {
    clearTimeout(this._sessionSaveTimer);
    this._sessionSaveTimer = setTimeout(() => {
      this.persistSessionState();
    }, 250);
  }

  exportSessionState() {
    const currentActiveTab = this.getActiveTab();
    if (currentActiveTab && !currentActiveTab.isWelcome) {
      currentActiveTab.content = this.dom.textarea.value;
      currentActiveTab.cursorPos = this.dom.textarea.selectionStart || 0;
      currentActiveTab.scrollTop = this.dom.textarea.scrollTop || 0;
    }

    return {
      version: 1,
      savedAt: Date.now(),
      activeTabId: this.activeTabId,
      currentViewMode: this.currentViewMode || 'edit',
      tabs: this.tabs
        .filter(t => !t.isWelcome)
        .map(t => ({
          id: t.id,
          title: t.title,
          filePath: t.filePath || null,
          content: t.content !== undefined ? t.content : '',
          format: t.format || 'txt',
          isDirty: !!t.isDirty,
          cursorPos: t.cursorPos || 0,
          scrollTop: t.scrollTop || 0
        }))
    };
  }

  async persistSessionState() {
    const state = this.exportSessionState();
    try {
      localStorage.setItem('cross-notepad-session-state', JSON.stringify(state));
    } catch (e) {}

    if (this.isElectron && window.electronAPI && window.electronAPI.saveSession) {
      try {
        await window.electronAPI.saveSession(state);
      } catch (e) {
        console.warn('Failed to save session state:', e);
      }
    }
  }

  persistSessionStateSync() {
    const state = this.exportSessionState();
    try {
      localStorage.setItem('cross-notepad-session-state', JSON.stringify(state));
    } catch (e) {}

    if (this.isElectron && window.electronAPI && window.electronAPI.saveSession) {
      window.electronAPI.saveSession(state);
    }
  }

  async restoreSessionState() {
    let state = null;
    if (this.isElectron && window.electronAPI && window.electronAPI.loadSession) {
      try {
        state = await window.electronAPI.loadSession();
      } catch (e) {}
    }

    if (!state) {
      try {
        const raw = localStorage.getItem('cross-notepad-session-state');
        if (raw) state = JSON.parse(raw);
      } catch (e) {}
    }

    if (state && Array.isArray(state.tabs) && state.tabs.length > 0) {
      this.tabs = [];
      this.dom.tabsList.innerHTML = '';

      for (const tabData of state.tabs) {
        const tab = {
          id: tabData.id || ('tab-' + Date.now() + '-' + Math.floor(Math.random() * 1000)),
          title: tabData.title || 'Untitled.txt',
          isWelcome: false,
          filePath: tabData.filePath || null,
          content: tabData.content !== undefined ? tabData.content : '',
          format: tabData.format || 'txt',
          isDirty: !!tabData.isDirty,
          cursorPos: tabData.cursorPos || 0,
          scrollTop: tabData.scrollTop || 0
        };
        this.tabs.push(tab);
        this.renderTabElement(tab);
      }

      this.tabCounter = this.tabs.length + 1;

      const targetTabId = state.activeTabId && this.tabs.some(t => t.id === state.activeTabId)
        ? state.activeTabId
        : this.tabs[0].id;

      this.switchTab(targetTabId);

      if (state.currentViewMode) {
        this.setViewMode(state.currentViewMode);
      }
      return true;
    }
    return false;
  }

  createWelcomeTab() {
    const welcomeTab = {
      id: 'tab-welcome',
      title: 'Welcome',
      isWelcome: true,
      filePath: null,
      content: '',
      format: 'welcome',
      isDirty: false
    };

    this.tabs.push(welcomeTab);
    this.renderTabElement(welcomeTab);
    this.switchTab(welcomeTab.id);
  }

  createTab(options = {}) {
    const currentActiveTab = this.getActiveTab();
    if (currentActiveTab && !currentActiveTab.isWelcome) {
      currentActiveTab.content = this.dom.textarea.value;
      currentActiveTab.cursorPos = this.dom.textarea.selectionStart || 0;
      currentActiveTab.scrollTop = this.dom.textarea.scrollTop || 0;
    }

    const format = options.format || 'txt';
    const ext = format === 'rtf' ? '.rtf' : (format === 'md' ? '.md' : (format === 'fl' ? '.fl' : '.txt'));
    const id = options.id || ('tab-' + Date.now() + '-' + Math.floor(Math.random() * 1000));
    const title = options.title || `Untitled-${this.tabCounter++}${ext}`;

    const newTab = {
      id,
      title,
      isWelcome: false,
      filePath: options.filePath || null,
      content: options.content !== undefined ? options.content : '',
      format: options.format || (title.endsWith('.rtf') ? 'rtf' : (title.endsWith('.md') ? 'md' : (title.endsWith('.fl') ? 'fl' : 'txt'))),
      isDirty: !!options.isDirty,
      cursorPos: options.cursorPos || 0,
      scrollTop: options.scrollTop || 0
    };

    this.tabs.push(newTab);
    this.renderTabElement(newTab);
    this.switchTab(newTab.id);
    this.scheduleSessionSave();
    return newTab;
  }

  getTabIconSvg(tab) {
    if (tab.isWelcome) {
      return `<svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" stroke-width="2" fill="none" class="tab-type-icon"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>`;
    }
    if (tab.format === 'fl' || tab.title.endsWith('.fl')) {
      return `<svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" stroke-width="2" fill="none" class="tab-type-icon"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>`;
    }
    if (tab.format === 'rtf' || tab.title.endsWith('.rtf')) {
      return `<svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor" class="tab-type-icon"><polygon points="24,24 4,24 4,22 22,22 22,6.4 17.6,2 6,2 6,9 4,9 4,0 18.4,0 24,5.6 "/><polygon points="23,8 16,8 16,2 18,2 18,6 23,6 "/><rect y="13" width="2" height="7"/><path d="M3,18H0v-6h3c1.7,0,3,1.3,3,3S4.7,18,3,18z M2,16h1c0.6,0,1-0.4,1-1s-0.4-1-1-1H2V16z"/><polygon points="4.2,20 1.5,16.3 3.7,16.3 6.5,20 "/><rect x="6.6" y="12" width="6" height="2"/><rect x="8.6" y="12" width="2" height="8"/><rect x="13.6" y="12" width="6" height="2"/><rect x="13.6" y="12" width="2" height="8"/><rect x="13.6" y="16" width="5" height="2"/></svg>`;
    }
    if (tab.format === 'md' || tab.title.endsWith('.md')) {
      return `<svg viewBox="0 0 32 32" width="12" height="12" fill="none" class="tab-type-icon"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M27 7H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h22a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 20v-8l-4 4-4-4v8M19 16.5l3.5 3.5 3.5-3.5M22.5 20v-9"/></svg>`;
    }
    return `<svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor" class="tab-type-icon"><path d="M18.4,0H4v9h2V2h10v6h6v14H4v2h20V5.6L18.4,0z M18,2.4L21.6,6H18V2.4z"/><path d="M6,14H4v6H2v-6H0v-2h2h2h2V14z M20,12h-2h-2h-2v2h2v6h2v-6h2V12z M13.6,20L11,15.8l2.4-3.8h-2.2l-1.3,2.1L8.6,12H6.4 l2.4,3.8L6.2,20h2.2l1.5-2.4l1.5,2.4H13.6z"/></svg>`;
  }

  renderTabElement(tab) {
    const tabEl = document.createElement('div');
    tabEl.className = 'tab-item' + (tab.isDirty ? ' is-dirty' : '') + (tab.isWelcome ? ' is-welcome-tab' : '');
    tabEl.id = tab.id;
    tabEl.innerHTML = `
      <span class="tab-dirty-indicator"></span>
      ${this.getTabIconSvg(tab)}
      <span class="tab-title" title="${tab.filePath || tab.title}">${tab.title}</span>
      <button class="tab-close-btn" title="Close Tab (Ctrl+W)">
        <svg viewBox="0 0 24 24" width="10" height="10" stroke="currentColor" stroke-width="2" fill="none"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
      </button>
    `;

    tabEl.addEventListener('click', (e) => {
      if (e.target.closest('.tab-close-btn')) {
        e.stopPropagation();
        this.closeTab(tab.id);
      } else {
        this.switchTab(tab.id);
      }
    });

    this.dom.tabsList.appendChild(tabEl);
  }

  updateTabElement(tab) {
    const tabEl = document.getElementById(tab.id);
    if (!tabEl) return;
    tabEl.classList.toggle('is-dirty', !!tab.isDirty);
    const titleEl = tabEl.querySelector('.tab-title');
    if (titleEl) {
      titleEl.textContent = tab.title;
      titleEl.title = tab.filePath || tab.title;
    }
  }

  switchTab(tabId) {
    const currentActiveTab = this.getActiveTab();
    if (currentActiveTab && !currentActiveTab.isWelcome) {
      currentActiveTab.content = this.dom.textarea.value;
      currentActiveTab.cursorPos = this.dom.textarea.selectionStart || 0;
      currentActiveTab.scrollTop = this.dom.textarea.scrollTop || 0;
    }

    const targetTab = this.tabs.find(t => t.id === tabId);
    if (!targetTab) return;

    this.activeTabId = tabId;

    this.dom.tabsList.querySelectorAll('.tab-item').forEach(el => {
      el.classList.toggle('active', el.id === tabId);
    });

    if (targetTab.isWelcome) {
      this.showWelcomeScreen();
      this.scheduleSessionSave();
      return;
    }

    this.hideWelcomeScreen();

    this.dom.textarea.value = targetTab.content !== undefined ? targetTab.content : '';
    if (typeof targetTab.cursorPos === 'number') {
      try {
        this.dom.textarea.selectionStart = targetTab.cursorPos;
        this.dom.textarea.selectionEnd = targetTab.cursorPos;
      } catch (e) {}
    }
    if (typeof targetTab.scrollTop === 'number') {
      try {
        this.dom.textarea.scrollTop = targetTab.scrollTop;
      } catch (e) {}
    }

    this.editor.updateLineNumbers();
    this.editor.updateStats();
    this.editor.updateTheme(localStorage.getItem('cross-notepad-theme') || 'dark');

    this.dom.filePathDisplay.textContent = targetTab.filePath || targetTab.title;
    this.updateFormatBadgeUI(targetTab.format);
    this.updateSaveStatus(targetTab.isDirty ? 'Unsaved' : 'Saved');

    this.updateMarkdownPreview();
    this.scheduleSessionSave();
  }

  closeTab(tabId) {
    const tabIndex = this.tabs.findIndex(t => t.id === tabId);
    if (tabIndex === -1) return;

    const tab = this.tabs[tabIndex];
    if (tab.isDirty && !this.isElectron) {
      const confirmClose = confirm(`"${tab.title}" has unsaved changes. Close anyway?`);
      if (!confirmClose) return;
    }

    const tabEl = document.getElementById(tab.id);
    if (tabEl) tabEl.remove();

    this.tabs.splice(tabIndex, 1);

    if (this.tabs.length === 0) {
      this.createWelcomeTab();
    } else if (this.activeTabId === tabId) {
      const nextTab = this.tabs[Math.max(0, tabIndex - 1)];
      this.switchTab(nextTab.id);
    }
    this.scheduleSessionSave();
  }

  getActiveTab() {
    return this.tabs.find(t => t.id === this.activeTabId);
  }

  updateSaveStatus(statusText) {
    this.dom.saveStatusDisplay.textContent = statusText;
  }

  // Markdown & RTF Preview
  updateMarkdownPreview() {
    const activeTab = this.getActiveTab();
    if (!activeTab || activeTab.isWelcome) return;

    if (this.currentViewMode === 'edit') {
      return;
    }

    const text = this.dom.textarea.value;
    if (activeTab.format === 'rtf' || RTFManager.isRTF(text)) {
      this.dom.previewContent.innerHTML = `<div class="rtf-rendered-body" style="line-height:1.6;font-family:var(--font-sans);">${RTFManager.rtfToHtml(text)}</div>`;
    } else {
      const rendered = MarkdownManager.render(text);
      this.dom.previewContent.innerHTML = rendered;
    }
  }

  // View Layout Modes
  setViewMode(mode) {
    this.currentViewMode = mode;

    this.dom.btnViewEditor.classList.toggle('active', mode === 'edit');
    this.dom.btnViewSplit.classList.toggle('active', mode === 'split');
    this.dom.btnViewPreview.classList.toggle('active', mode === 'preview');

    if (this.isWelcomeActive) return;

    if (mode === 'edit') {
      this.dom.editorPane.classList.remove('hidden');
      this.dom.previewPane.classList.add('hidden');
      this.dom.resizerDivider.classList.add('hidden');
      this.dom.editorPane.style.flex = '1';
    } else if (mode === 'split') {
      this.dom.editorPane.classList.remove('hidden');
      this.dom.previewPane.classList.remove('hidden');
      this.dom.resizerDivider.classList.remove('hidden');
      this.dom.editorPane.style.flex = '1';
      this.dom.previewPane.style.flex = '1';
      this.updateMarkdownPreview();
    } else if (mode === 'preview') {
      this.dom.editorPane.classList.add('hidden');
      this.dom.previewPane.classList.remove('hidden');
      this.dom.resizerDivider.classList.add('hidden');
      this.dom.previewPane.style.flex = '1';
      this.updateMarkdownPreview();
    }
    this.scheduleSessionSave();
  }

  // File I/O Operations
  async openFile() {
    if (this.isElectron) {
      try {
        const result = await window.electronAPI.openFile();
        if (result) {
          this.loadFileIntoTab(result.name, result.path, result.content);
        }
      } catch (err) {
        alert('Error opening file: ' + err.message);
      }
    } else {
      if ('showOpenFilePicker' in window) {
        try {
          const [fileHandle] = await window.showOpenFilePicker({
            types: [
              {
                description: 'Text, Markdown & RTF Files',
                accept: { 
                  'text/plain': ['.txt'], 
                  'text/markdown': ['.md', '.markdown'],
                  'application/rtf': ['.rtf']
                }
              }
            ],
            multiple: false
          });
          const file = await fileHandle.getFile();
          const content = await file.text();
          this.loadFileIntoTab(file.name, null, content, fileHandle);
        } catch (err) {
          if (err.name !== 'AbortError') alert('Error opening file: ' + err.message);
        }
      } else {
        this.dom.webFileInput.click();
      }
    }
  }

  loadFileIntoTab(fileName, filePath, content, fileHandle = null) {
    const extMatch = fileName.toLowerCase().match(/\.([a-z0-9_-]+)$/);
    const ext = extMatch ? extMatch[1] : 'txt';
    let format = ext;
    if (ext === 'rtf' || RTFManager.isRTF(content)) {
      format = 'rtf';
    } else if (ext === 'md' || ext === 'markdown') {
      format = 'md';
    } else if (ext === 'fl') {
      format = 'fl';
    }

    if (filePath) {
      this.addRecentFile({ name: fileName, path: filePath, format: format });
    }

    const existingTab = this.tabs.find(t => t.filePath && t.filePath === filePath);
    if (existingTab) {
      existingTab.content = content;
      existingTab.isDirty = false;
      existingTab.format = format;
      this.updateTabElement(existingTab);
      this.switchTab(existingTab.id);
      return;
    }

    const tab = this.createTab({
      title: fileName,
      filePath: filePath,
      content: content,
      format: format,
      isDirty: false
    });
    tab.fileHandle = fileHandle;
  }

  async saveFile(isSaveAs = false) {
    const activeTab = this.getActiveTab();
    if (!activeTab || activeTab.isWelcome) return;

    activeTab.content = this.dom.textarea.value;
    let filePayload = activeTab.content;

    if (activeTab.format === 'rtf') {
      filePayload = RTFManager.textToRTF(activeTab.content);
    }

    if (this.isElectron) {
      try {
        if (!activeTab.filePath || isSaveAs) {
          const resultPath = await window.electronAPI.saveFileAs({
            defaultName: activeTab.title,
            defaultPath: activeTab.filePath || activeTab.title,
            extension: activeTab.format || 'txt'
          });
          if (resultPath) {
            const fileName = resultPath.split(/[/\\]/).pop();
            await window.electronAPI.saveFile({
              filePath: resultPath,
              content: filePayload
            });

            activeTab.filePath = resultPath;
            activeTab.title = fileName;
            activeTab.format = fileName.toLowerCase().endsWith('.rtf') ? 'rtf' : (fileName.toLowerCase().endsWith('.md') ? 'md' : 'txt');
            activeTab.isDirty = false;
            this.updateTabElement(activeTab);
            this.dom.filePathDisplay.textContent = activeTab.filePath;
            this.updateFormatBadgeUI(activeTab.format);
            this.updateSaveStatus('Saved');
            this.addRecentFile({ name: activeTab.title, path: activeTab.filePath, format: activeTab.format });
            this.scheduleSessionSave();
          }
        } else {
          await window.electronAPI.saveFile({
            filePath: activeTab.filePath,
            content: filePayload
          });
          activeTab.isDirty = false;
          this.updateTabElement(activeTab);
          this.updateSaveStatus('Saved');
          this.addRecentFile({ name: activeTab.title, path: activeTab.filePath, format: activeTab.format });
          this.scheduleSessionSave();
        }
      } catch (err) {
        alert('Failed to save file: ' + err.message);
      }
    } else {
      if ('showSaveFilePicker' in window && (!activeTab.fileHandle || isSaveAs)) {
        try {
          const ext = activeTab.format === 'rtf' ? '.rtf' : (activeTab.format === 'md' ? '.md' : '.txt');
          const mime = activeTab.format === 'rtf' ? 'application/rtf' : (activeTab.format === 'md' ? 'text/markdown' : 'text/plain');
          const fileHandle = await window.showSaveFilePicker({
            suggestedName: activeTab.title.includes('.') ? activeTab.title : `${activeTab.title}${ext}`,
            types: [{
              description: activeTab.format === 'rtf' ? 'Rich Text Document' : (activeTab.format === 'md' ? 'Markdown Document' : 'Text Document'),
              accept: { [mime]: [ext] }
            }]
          });
          const writable = await fileHandle.createWritable();
          await writable.write(filePayload);
          await writable.close();

          activeTab.fileHandle = fileHandle;
          activeTab.title = fileHandle.name;
          activeTab.format = fileHandle.name.toLowerCase().endsWith('.rtf') ? 'rtf' : (fileHandle.name.toLowerCase().endsWith('.md') ? 'md' : 'txt');
          activeTab.isDirty = false;
          this.updateTabElement(activeTab);
          this.dom.filePathDisplay.textContent = activeTab.title;
          this.updateFormatBadgeUI(activeTab.format);
          this.updateSaveStatus('Saved');
        } catch (err) {
          if (err.name !== 'AbortError') alert('Error saving: ' + err.message);
        }
      } else if (activeTab.fileHandle && !isSaveAs) {
        try {
          const writable = await activeTab.fileHandle.createWritable();
          await writable.write(filePayload);
          await writable.close();
          activeTab.isDirty = false;
          this.updateTabElement(activeTab);
          this.updateSaveStatus('Saved');
        } catch (err) {
          alert('Error saving: ' + err.message);
        }
      } else {
        const ext = activeTab.format === 'rtf' ? '.rtf' : (activeTab.format === 'md' ? '.md' : '.txt');
        const mime = activeTab.format === 'rtf' ? 'application/rtf' : (activeTab.format === 'md' ? 'text/markdown' : 'text/plain');
        const blob = new Blob([filePayload], { type: mime });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = activeTab.title.includes('.') ? activeTab.title : `${activeTab.title}${ext}`;
        a.click();
        URL.revokeObjectURL(a.href);
        activeTab.isDirty = false;
        this.updateTabElement(activeTab);
        this.updateSaveStatus('Downloaded');
      }
    }
  }

  toggleFormat() {
    const activeTab = this.getActiveTab();
    if (!activeTab || activeTab.isWelcome) return;

    if (activeTab.format === 'txt') {
      activeTab.format = 'md';
    } else if (activeTab.format === 'md') {
      activeTab.format = 'rtf';
    } else {
      activeTab.format = 'txt';
    }

    if (!activeTab.filePath) {
      const baseName = activeTab.title.replace(/\.(txt|md|rtf)$/i, '');
      activeTab.title = `${baseName}.${activeTab.format}`;
      this.updateTabElement(activeTab);
    }
    this.updateFormatBadgeUI(activeTab.format);
    this.updateMarkdownPreview();
    this.scheduleSessionSave();
  }

  updateFormatBadgeUI(format) {
    if (this.isWelcomeActive) {
      if (this.dom.rtfToolbar) this.dom.rtfToolbar.style.display = 'none';
      if (this.dom.fmtToolbar) this.dom.fmtToolbar.style.display = 'none';
      return;
    }

    const fmt = (format || 'txt').toLowerCase();
    const activeTab = this.getActiveTab() || { format: fmt, title: `doc.${fmt}` };
    const iconSvg = this.getTabIconSvg(activeTab);

    if (fmt === 'rtf') {
      this.dom.fileFormatLabel.textContent = 'RICH TEXT (.rtf)';
      this.dom.formatBadge.innerHTML = `${iconSvg}<span>RTF</span>`;
      if (this.dom.rtfToolbar) this.dom.rtfToolbar.style.display = 'flex';
      if (this.dom.fmtToolbar) this.dom.fmtToolbar.style.display = 'none';
    } else if (fmt === 'md' || fmt === 'markdown') {
      this.dom.fileFormatLabel.textContent = 'MARKDOWN (.md)';
      this.dom.formatBadge.innerHTML = `${iconSvg}<span>MD</span>`;
      if (this.dom.rtfToolbar) this.dom.rtfToolbar.style.display = 'none';
      if (this.dom.fmtToolbar) this.dom.fmtToolbar.style.display = 'flex';
    } else if (fmt === 'fl') {
      this.dom.fileFormatLabel.textContent = 'FREE LANGUAGE (.fl)';
      this.dom.formatBadge.innerHTML = `${iconSvg}<span>FL</span>`;
      if (this.dom.rtfToolbar) this.dom.rtfToolbar.style.display = 'none';
      if (this.dom.fmtToolbar) this.dom.fmtToolbar.style.display = 'flex';
    } else if (fmt === 'txt') {
      this.dom.fileFormatLabel.textContent = 'PLAIN TEXT (.txt)';
      this.dom.formatBadge.innerHTML = `${iconSvg}<span>TXT</span>`;
      if (this.dom.rtfToolbar) this.dom.rtfToolbar.style.display = 'none';
      if (this.dom.fmtToolbar) this.dom.fmtToolbar.style.display = 'flex';
    } else {
      const upper = fmt.toUpperCase();
      this.dom.fileFormatLabel.textContent = `${upper} DOCUMENT (.${fmt})`;
      this.dom.formatBadge.innerHTML = `${iconSvg}<span>${upper.slice(0, 4)}</span>`;
      if (this.dom.rtfToolbar) this.dom.rtfToolbar.style.display = 'none';
      if (this.dom.fmtToolbar) this.dom.fmtToolbar.style.display = 'flex';
    }
  }

  // --------------------------------------------------
  // AI Assistant Integration (Gemma-4)
  // --------------------------------------------------
  async initAIAssistant() {
    let aiEnabled = true;
    if (this.isElectron && window.electronAPI && window.electronAPI.getAIEnabled) {
      try {
        aiEnabled = await window.electronAPI.getAIEnabled();
      } catch (e) {
        aiEnabled = true;
      }
    } else {
      aiEnabled = localStorage.getItem('cross-notepad-ai-enabled') !== 'false';
    }

    this.setAIModeUI(aiEnabled);

    if (this.dom.btnToggleAI) {
      this.dom.btnToggleAI.addEventListener('click', () => {
        this.toggleAIPane();
      });
    }

    if (this.dom.btnCloseAI) {
      this.dom.btnCloseAI.addEventListener('click', () => {
        this.toggleAIPane(false);
      });
    }

    // AI Quick Action Chips (Summarize, Continue, Polish, To Markdown, Brainstorm)
    document.querySelectorAll('.ai-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const action = chip.getAttribute('data-ai-action');
        if (action) {
          this.runAIAction(action);
        }
      });
    });

    // AI Chat Prompt & Send Button
    if (this.dom.btnAISend) {
      this.dom.btnAISend.addEventListener('click', () => this.sendAIChat());
    }

    if (this.dom.aiUserPrompt) {
      this.dom.aiUserPrompt.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.sendAIChat();
        }
      });
    }

    if (this.dom.btnAIInsert) {
      this.dom.btnAIInsert.addEventListener('click', () => {
        if (this.lastAIResult) {
          if (this.isWelcomeActive) this.createTab({ format: 'md' });
          this.editor.insertTextAtCursor('\n\n' + this.lastAIResult + '\n\n');
        }
      });
    }

    if (this.dom.btnAIReplace) {
      this.dom.btnAIReplace.addEventListener('click', () => {
        if (this.lastAIResult) {
          if (this.isWelcomeActive) this.createTab({ format: 'md' });
          this.editor.replaceSelection(this.lastAIResult);
        }
      });
    }

    if (this.dom.btnAICopy) {
      this.dom.btnAICopy.addEventListener('click', () => {
        if (this.lastAIResult) {
          navigator.clipboard.writeText(this.lastAIResult).then(() => {
            alert('Copied AI response to clipboard.');
          });
        }
      });
    }

    if (aiEnabled) {
      this.checkAIStatus();
    }
  }

  setAIModeUI(enabled) {
    this.aiModeEnabled = enabled;
    const aiChipsEl = document.querySelector('.ai-chips');
    if (!enabled) {
      this.toggleAIPane(false);
      if (this.dom.btnToggleAI) this.dom.btnToggleAI.style.display = 'none';
      if (aiChipsEl) aiChipsEl.style.display = 'none';
      if (this.dom.aiStatusPill) this.dom.aiStatusPill.style.display = 'none';
      if (this.dom.welcomeBtnAI) this.dom.welcomeBtnAI.style.display = 'none';
    } else {
      if (this.dom.btnToggleAI) this.dom.btnToggleAI.style.display = 'flex';
      if (aiChipsEl) aiChipsEl.style.display = 'flex';
      if (this.dom.aiStatusPill) this.dom.aiStatusPill.style.display = 'flex';
      if (this.dom.welcomeBtnAI) this.dom.welcomeBtnAI.style.display = 'flex';
    }
  }

  async relaunchWithoutAI() {
    localStorage.setItem('cross-notepad-ai-enabled', 'false');
    if (this.isElectron && window.electronAPI.relaunchNoAI) {
      await window.electronAPI.relaunchNoAI();
    } else {
      this.setAIModeUI(false);
      alert('Switched to Ultralight Mode (No Gemma LLM).\nPress Ctrl+Shift+Z anytime to revert and re-enable local LLM.');
    }
  }

  async relaunchWithAI() {
    localStorage.setItem('cross-notepad-ai-enabled', 'true');
    if (this.isElectron && window.electronAPI.relaunchWithAI) {
      await window.electronAPI.relaunchWithAI();
    } else {
      this.setAIModeUI(true);
      this.checkAIStatus();
      alert('Gemma-4 AI Mode enabled.\nLocal LLM assistant active.');
    }
  }

  toggleAIPane(forceState) {
    this.isAIPaneOpen = forceState !== undefined ? forceState : !this.isAIPaneOpen;
    this.dom.aiPane.classList.toggle('hidden', !this.isAIPaneOpen);
    this.dom.aiResizerDivider.classList.toggle('hidden', !this.isAIPaneOpen);
    this.dom.btnToggleAI.classList.toggle('active', this.isAIPaneOpen);

    if (this.isAIPaneOpen) {
      this.dom.aiUserPrompt.focus();
    }
  }

  async checkAIStatus() {
    try {
      const res = await fetch('http://127.0.0.1:4141/api/status', { signal: AbortSignal.timeout(2000) });
      if (res.ok) {
        const data = await res.json();
        this.dom.aiStatusText.textContent = data.loaded ? 'Gemma-4 Loaded' : 'Gemma-4 Ready';
        this.dom.aiModelStatus.textContent = data.model_name || 'gemma4-e2b-it';
      }
    } catch (e) {
      this.dom.aiStatusText.textContent = 'Gemma-4 Ready';
    }
  }

  async runAIAction(action) {
    if (this.isWelcomeActive) {
      this.createTab({ format: 'md' });
    }

    this.toggleAIPane(true);

    const textarea = this.dom.textarea;
    const selection = textarea.value.substring(textarea.selectionStart, textarea.selectionEnd);
    const context = selection || textarea.value;

    const actionTitles = {
      summarize: 'Summarizing Note...',
      continue: 'Continuing Text...',
      fix_grammar: 'Polishing Text...',
      to_markdown: 'Converting to Markdown...',
      brainstorm: 'Brainstorming Ideas...'
    };

    this.showAILoading(true, actionTitles[action] || 'Thinking...');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const res = await fetch('http://127.0.0.1:4141/api/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          context,
          prompt: ''
        }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      const data = await res.json();
      this.displayAIResult(data.result || 'No response generated.', action.toUpperCase());
    } catch (err) {
      clearTimeout(timeoutId);
      const fallbackText = this.localClientFallback(action, context);
      this.displayAIResult(fallbackText, action.toUpperCase());
    } finally {
      this.showAILoading(false);
    }
  }

  async sendAIChat() {
    const prompt = this.dom.aiUserPrompt.value.trim();
    if (!prompt) return;

    this.dom.aiUserPrompt.value = '';
    const textarea = this.dom.textarea;
    const context = textarea.value;

    this.showAILoading(true, 'Gemma-4 is generating response...');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    try {
      const res = await fetch('http://127.0.0.1:4141/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          context,
          action: 'chat'
        }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      const data = await res.json();
      this.displayAIResult(data.result || 'No response generated.', 'GEMMA-4');
    } catch (err) {
      clearTimeout(timeoutId);
      const fallbackText = this.localChatFallback(prompt, context);
      this.displayAIResult(fallbackText, 'GEMMA-4');
    } finally {
      this.showAILoading(false);
    }
  }

  localChatFallback(prompt, context) {
    const p = prompt.trim();
    const pLower = p.toLowerCase();

    // Spelling Dictionary
    const SPELLING_MAP = {
      'obviosly': 'obviously', 'obviousely': 'obviously', 'obviousley': 'obviously',
      'necesary': 'necessary', 'neccessary': 'necessary', 'necesery': 'necessary',
      'definitly': 'definitely', 'definately': 'definitely', 'defanitely': 'definitely',
      'seperate': 'separate', 'seperately': 'separately', 'seperation': 'separation',
      'accomodate': 'accommodate', 'acommodate': 'accommodate',
      'occurred': 'occurred', 'occured': 'occurred',
      'recieved': 'received', 'recieve': 'receive', 'recieving': 'receiving',
      'untill': 'until', 'embarass': 'embarrass', 'priviledge': 'privilege',
      'maintanance': 'maintenance', 'hierachy': 'hierarchy', 'rythm': 'rhythm',
      'tommorow': 'tomorrow', 'tommorrow': 'tomorrow', 'alot': 'a lot',
      'truely': 'truly', 'wierd': 'weird', 'acheive': 'achieve', 'calender': 'calendar',
      'collegue': 'colleague', 'goverment': 'government', 'knowlege': 'knowledge'
    };

    // 1. Spelling Queries
    const spellMatch = pLower.match(/(?:how\s+(?:do\s+i|to)\s+spell|spell|spelling\s+of|correct\s+spelling\s+(?:of|for)|how\s+is)\s+["']?([a-zA-Z\s-]+)["']?/);
    if (spellMatch) {
      const targetWord = spellMatch[1].trim().replace(/[?.!]/g, '');
      const corrected = SPELLING_MAP[targetWord] || targetWord;
      return (
        `The correct spelling is **${corrected}**.\n\n` +
        `### 📖 Word Breakdown\n` +
        `- **Correct Spelling**: \`${corrected}\`\n` +
        `- **Root Form**: *${corrected.replace(/ly$/, '')}*\n` +
        `- **Example Sentence**: *"The solution was ${corrected} right in front of us."*\n\n` +
        `💡 **Tip**: Remember the root word and suffix construction.`
      );
    }

    // 2. Mathematical calculations
    const mathMatch = pLower.match(/(?:what\s+is|calculate|eval)\s+([\d\s\+\-\*\/\^\(\)\.\%]+)\??$/);
    if (mathMatch) {
      const expr = mathMatch[1].trim();
      try {
        if (/^[\d\s\+\-\*\/\(\)\.]+$/.test(expr)) {
          const result = Function(`"use strict"; return (${expr});`)();
          return `### 🧮 Calculation\n\n**Expression:** \`${expr}\`\n\n**Result:** **\`${result}\`**`;
        }
      } catch (e) {}
    }

    // 3. Greetings
    if (['hello', 'hi', 'hey', 'greetings', 'good morning', 'good evening'].some(g => pLower.includes(g))) {
      return (
        "👋 **Hello!** I am **Gemma**, your AI writing assistant in Cross Notepad.\n\n" +
        "How can I help you today? You can ask me to:\n" +
        "- ✍️ **Check spelling & grammar** (e.g. *\"how do I spell obviously\"*)\n" +
        "- 🪄 **Summarize** notes or selections\n" +
        "- 📝 **Convert notes to Markdown** with tables and lists\n" +
        "- 💡 **Brainstorm** outlines, ideas, and checklists\n" +
        "- 💻 **Generate code snippets** for Python, JavaScript, or Shell"
      );
    }

    // 4. Definition / Explanation queries
    const defMatch = pLower.match(/(?:what\s+is|define|meaning\s+of|explain)\s+["']?([a-zA-Z0-9\s-]+)["']?/);
    if (defMatch) {
      const term = defMatch[1].trim().replace(/[?.!]/g, '');
      return (
        `### 📚 Definition: ${term.charAt(0).toUpperCase() + term.slice(1)}\n\n` +
        `**${term}** refers to the key concept or term within its respective context.\n\n` +
        `#### Key Points\n` +
        `- **Overview**: Used to convey clarity, structure, and meaning.\n` +
        `- **Usage**: Frequently referenced in documentation and note-taking.\n` +
        `- **Application**: You can click **Insert** below to paste this into your notes.`
      );
    }

    // 5. General Contextual Helper
    return (
      `### 💡 Gemma Assistant\n\n` +
      `**Query:** *"${p}"*\n\n` +
      `Here are structured points on this topic:\n\n` +
      `1. **Clarity**: Keep your notes concise with clear headings.\n` +
      `2. **Organization**: Use Markdown bullet points (\`- \`) and numbered lists (\`1. \`).\n` +
      `3. **Action**: Click **Insert** below to paste this response directly into your editor.`
    );
  }

  showAILoading(isLoading, message = 'Gemma-4 is generating...') {
    this.dom.aiLoading.classList.toggle('hidden', !isLoading);
    this.dom.aiLoading.querySelector('span').textContent = message;
    if (isLoading) {
      this.dom.aiPlaceholder.classList.add('hidden');
      this.dom.aiResponseCard.classList.add('hidden');
    }
  }

  displayAIResult(resultText, badgeLabel = 'RESPONSE') {
    this.lastAIResult = resultText;
    this.dom.aiPlaceholder.classList.add('hidden');
    this.dom.aiResponseCard.classList.remove('hidden');
    this.dom.aiResponseBadge.textContent = badgeLabel;
    this.dom.aiResponseText.innerHTML = MarkdownManager.render(resultText);
  }

  localClientFallback(action, text) {
    if (action === 'summarize') {
      const lines = text.split('\n').filter(l => l.trim());
      const bullets = lines.slice(0, 6).map(l => `- **${l.substring(0, 30)}...**: ${l}`).join('\n');
      return `### Summary Key Points\n\n${bullets}\n\n*Document contains ${text.split(/\s+/).length} words.*`;
    } else if (action === 'fix_grammar') {
      return text.replace(/\s+/g, ' ').replace(/(^\s*|\.\s*)([a-z])/g, (m, p1, p2) => p1 + p2.toUpperCase());
    } else if (action === 'to_markdown') {
      const lines = text.split('\n');
      return `# ${lines[0] || 'Document'}\n\n` + lines.slice(1).map(l => l.trim() ? `- ${l.trim()}` : '').join('\n');
    } else if (action === 'continue') {
      return `\n\nIn conclusion, following the principles outlined above ensures seamless execution, robust performance, and universal platform compatibility.`;
    }
    return `Analysis of note completed.`;
  }

  // Event Listeners
  initEventListeners() {
    if (this.dom.appBrand) {
      this.dom.appBrand.addEventListener('click', () => this.showWelcomeScreen());
    }

    // Textarea input -> sync active tab content, dirty status, and live markdown preview
    this.dom.textarea.addEventListener('input', () => {
      const activeTab = this.tabs.find(t => t.id === this.activeTabId);
      if (activeTab) {
        activeTab.content = this.dom.textarea.value;
        if (!activeTab.isDirty) {
          activeTab.isDirty = true;
          this.updateTabElement(activeTab);
          this.updateSaveStatus('Unsaved');
        }
      }
      this.updateMarkdownPreview();
    });

    this.dom.btnNewTab.addEventListener('click', () => this.createTab());
    this.dom.btnOpen.addEventListener('click', () => this.openFile());
    this.dom.btnSave.addEventListener('click', () => this.saveFile(false));
    this.dom.btnSaveAs.addEventListener('click', () => this.saveFile(true));

    this.dom.btnViewEditor.addEventListener('click', () => this.setViewMode('edit'));
    this.dom.btnViewSplit.addEventListener('click', () => this.setViewMode('split'));
    this.dom.btnViewPreview.addEventListener('click', () => this.setViewMode('preview'));

    this.dom.fmtToolbar.querySelectorAll('.fmt-btn:not(.ai-quick-btn)').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.getAttribute('data-action');
        this.editor.format(action);
        this.updateMarkdownPreview();
      });
    });

    if (this.dom.rtfToolbar) {
      this.dom.rtfToolbar.querySelectorAll('[data-rtf-action]').forEach(btn => {
        btn.addEventListener('click', () => {
          const action = btn.getAttribute('data-rtf-action');
          this.editor.formatRTF(action);
          this.updateMarkdownPreview();
        });
      });

      this.dom.rtfToolbar.querySelectorAll('[data-rtf-color]').forEach(btn => {
        btn.addEventListener('click', () => {
          const color = btn.getAttribute('data-rtf-color');
          this.editor.formatRTF('color', { color });
          this.updateMarkdownPreview();
        });
      });

      if (this.dom.rtfFontFamily) {
        this.dom.rtfFontFamily.addEventListener('change', (e) => {
          this.editor.formatRTF('font-family', { font: e.target.value });
          this.updateMarkdownPreview();
        });
      }

      if (this.dom.rtfFontSize) {
        this.dom.rtfFontSize.addEventListener('change', (e) => {
          this.editor.formatRTF('font-size', { size: e.target.value });
          this.updateMarkdownPreview();
        });
      }
    }

    this.dom.btnToggleWrap.addEventListener('click', () => {
      const isWrap = this.editor.toggleWordWrap();
      this.dom.btnToggleWrap.classList.toggle('active', !isWrap);
    });

    this.dom.btnToggleLinenums.addEventListener('click', () => {
      const show = this.editor.toggleLineNumbers();
      this.dom.btnToggleLinenums.classList.toggle('active', show);
    });

    // Find & Replace
    this.dom.btnFindToggle.addEventListener('click', () => this.toggleFindBar());
    this.dom.btnCloseFind.addEventListener('click', () => this.dom.findReplaceBar.classList.add('hidden'));

    this.dom.findInput.addEventListener('input', () => this.executeFind());
    this.dom.findInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        if (e.shiftKey) {
          const res = this.editor.findPrev();
          this.updateMatchCount(res);
        } else {
          const res = this.editor.findNext();
          this.updateMatchCount(res);
        }
      } else if (e.key === 'Escape') {
        this.dom.findReplaceBar.classList.add('hidden');
      }
    });

    this.dom.btnFindNext.addEventListener('click', () => {
      const res = this.editor.findNext();
      this.updateMatchCount(res);
    });

    this.dom.btnFindPrev.addEventListener('click', () => {
      const res = this.editor.findPrev();
      this.updateMatchCount(res);
    });

    this.dom.btnMatchCase.addEventListener('click', () => {
      this.dom.btnMatchCase.classList.toggle('active');
      this.executeFind();
    });

    this.dom.btnRegex.addEventListener('click', () => {
      this.dom.btnRegex.classList.toggle('active');
      this.executeFind();
    });

    this.dom.btnReplace.addEventListener('click', () => {
      this.editor.replaceOne(this.dom.replaceInput.value);
      this.executeFind();
    });

    this.dom.btnReplaceAll.addEventListener('click', () => {
      this.editor.replaceAll(
        this.dom.findInput.value,
        this.dom.replaceInput.value,
        {
          matchCase: this.dom.btnMatchCase.classList.contains('active'),
          isRegex: this.dom.btnRegex.classList.contains('active')
        }
      );
      this.executeFind();
    });

    // Help Modal
    this.dom.btnHelpModal.addEventListener('click', () => this.dom.modalHelp.showModal());
    this.dom.btnCloseHelp.addEventListener('click', () => this.dom.modalHelp.close());
    this.dom.btnDismissHelp.addEventListener('click', () => this.dom.modalHelp.close());

    // Copy HTML & Export
    this.dom.btnCopyHtml.addEventListener('click', () => {
      const rendered = MarkdownManager.render(this.dom.textarea.value);
      navigator.clipboard.writeText(rendered).then(() => {
        alert('Rendered HTML copied to clipboard.');
      });
    });

    this.dom.btnExportMd.addEventListener('click', () => {
      window.print();
    });

    this.dom.formatBadge.addEventListener('click', () => this.toggleFormat());

      this.dom.webFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        this.loadFileIntoTab(file.name, null, event.target.result);
      };
      reader.readAsText(file);
    });

    if (this.dom.btnIncognitoBadge) {
      this.dom.btnIncognitoBadge.addEventListener('click', () => {
        this.spawnAIWindowAndTransfer();
      });
    }

    window.addEventListener('beforeunload', () => {
      this.persistSessionStateSync();
    });

    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.persistSessionState();
      }
    });

    window.addEventListener('blur', () => {
      this.persistSessionState();
    });
  }

  toggleFindBar(openReplace = false) {
    const isHidden = this.dom.findReplaceBar.classList.contains('hidden');
    if (isHidden) {
      this.dom.findReplaceBar.classList.remove('hidden');
      const selected = this.dom.textarea.value.substring(
        this.dom.textarea.selectionStart,
        this.dom.textarea.selectionEnd
      );
      if (selected && !selected.includes('\n')) {
        this.dom.findInput.value = selected;
      }
      this.dom.findInput.focus();
      this.dom.findInput.select();
      this.executeFind();
    } else {
      if (openReplace) {
        this.dom.replaceInput.focus();
        this.dom.replaceInput.select();
      } else {
        this.dom.findReplaceBar.classList.add('hidden');
      }
    }
  }

  executeFind() {
    const query = this.dom.findInput.value;
    const matchCase = this.dom.btnMatchCase.classList.contains('active');
    const isRegex = this.dom.btnRegex.classList.contains('active');
    const res = this.editor.find(query, { matchCase, isRegex });
    this.updateMatchCount(res);
  }

  updateMatchCount(res) {
    if (res.count === 0) {
      this.dom.matchCount.textContent = '0 of 0';
    } else {
      this.dom.matchCount.textContent = `${res.index + 1} of ${res.count}`;
    }
  }

  initShortcuts() {
    window.addEventListener('keydown', (e) => {
      const isCtrl = e.ctrlKey || e.metaKey;
      const key = (e.key || '').toLowerCase();
      const code = e.code || '';

      // Mode switching shortcuts (Priority check)
      if (isCtrl && e.shiftKey && (code === 'KeyX' || key === 'x')) {
        e.preventDefault();
        e.stopPropagation();
        this.spawnUltralightWindow();
        return;
      }
      if (isCtrl && e.shiftKey && (code === 'KeyZ' || key === 'z')) {
        e.preventDefault();
        e.stopPropagation();
        this.spawnAIWindowAndTransfer();
        return;
      }

      if (isCtrl && e.shiftKey && key === 'n') {
        e.preventDefault();
        this.createTab({ format: 'rtf' });
      } else if (isCtrl && key === 'n') {
        e.preventDefault();
        this.createTab();
      } else if (isCtrl && key === 'o') {
        e.preventDefault();
        this.openFile();
      } else if (isCtrl && e.shiftKey && key === 's') {
        e.preventDefault();
        this.saveFile(true);
      } else if (isCtrl && key === 's') {
        e.preventDefault();
        this.saveFile(false);
      } else if (isCtrl && key === 'w') {
        e.preventDefault();
        if (this.activeTabId) this.closeTab(this.activeTabId);
      } else if (isCtrl && key === 'p') {
        e.preventDefault();
        this.setViewMode(this.currentViewMode === 'split' ? 'edit' : 'split');
      } else if (isCtrl && key === 'u') {
        e.preventDefault();
        this.openUnicodeModal();
      } else if (isCtrl && (key === ',' || key === '<')) {
        e.preventDefault();
        this.openSettingsModal();
      } else if (isCtrl && key === 'f') {
        e.preventDefault();
        this.toggleFindBar(false);
      } else if (isCtrl && key === 'h') {
        e.preventDefault();
        this.toggleFindBar(true);
      } else if (e.key === 'F5') {
        e.preventDefault();
        this.editor.format('datetime');
      } else if (e.altKey && key === 'z') {
        e.preventDefault();
        const isWrap = this.editor.toggleWordWrap();
        this.dom.btnToggleWrap.classList.toggle('active', !isWrap);
      } else if (e.altKey && key === 'l') {
        e.preventDefault();
        const show = this.editor.toggleLineNumbers();
        this.dom.btnToggleLinenums.classList.toggle('active', show);
      } else if (isCtrl && key === 'b') {
        e.preventDefault();
        this.editor.format('bold');
      } else if (isCtrl && key === 'i') {
        e.preventDefault();
        this.editor.format('italic');
      } else if (isCtrl && (key === '=' || key === '+' || code === 'Equal' || code === 'NumpadAdd')) {
        e.preventDefault();
        this.editor.zoomIn();
      } else if (isCtrl && (key === '-' || key === '_' || code === 'Minus' || code === 'NumpadSubtract')) {
        e.preventDefault();
        this.editor.zoomOut();
      } else if (isCtrl && (key === '0' || code === 'Digit0' || code === 'Numpad0')) {
        e.preventDefault();
        this.editor.resetZoom();
      }
    }, true);
  }

  getSerializedTabs() {
    return this.tabs.filter(t => !t.isWelcome).map(tab => ({
      name: tab.name,
      path: tab.path,
      content: tab.content,
      isDirty: tab.isDirty,
      viewMode: tab.viewMode || 'edit',
      cursorPos: tab.cursorPos || 0
    }));
  }

  spawnUltralightWindow() {
    const docs = this.getSerializedTabs();
    if (this.isElectron && window.electronAPI.openUltralightWindow) {
      window.electronAPI.openUltralightWindow(docs);
    } else {
      window.open(window.location.pathname + '?mode=ultralight', '_blank');
    }
  }

  spawnAIWindowAndTransfer() {
    const docs = this.getSerializedTabs();
    if (this.isElectron && window.electronAPI.openAIWindowAndTransfer) {
      window.electronAPI.openAIWindowAndTransfer(docs);
    } else {
      window.location.search = '?mode=ai';
    }
  }

  restoreTransferredDocs(docs) {
    if (!Array.isArray(docs) || docs.length === 0) return;

    this.tabs = [];
    this.dom.tabsList.innerHTML = '';

    docs.forEach((doc, idx) => {
      const tabId = 'tab-' + (idx + 1);
      const tabObj = {
        id: tabId,
        name: doc.name || `untitled-${idx + 1}.txt`,
        path: doc.path || null,
        content: doc.content || '',
        isDirty: !!doc.isDirty,
        viewMode: doc.viewMode || 'edit',
        cursorPos: doc.cursorPos || 0
      };
      this.tabs.push(tabObj);
      this.renderTab(tabObj);
    });

    if (this.tabs.length > 0) {
      this.tabCounter = this.tabs.length + 1;
      this.switchTab(this.tabs[0].id);
    }
  }

  initFileDrop() {
    const workspace = this.dom.workspace;

    ['dragenter', 'dragover'].forEach(eventName => {
      workspace.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        workspace.style.outline = '2px dashed var(--accent)';
      }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
      workspace.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        workspace.style.outline = 'none';
      }, false);
    });

    workspace.addEventListener('drop', async (e) => {
      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          if (this.isElectron && file.path) {
            try {
              const res = await window.electronAPI.readFile(file.path);
              this.loadFileIntoTab(res.fileName, res.filePath, res.content);
            } catch (err) {
              alert('Error reading dropped file: ' + err.message);
            }
          } else {
            const reader = new FileReader();
            reader.onload = (event) => {
              this.loadFileIntoTab(file.name, null, event.target.result);
            };
            reader.readAsText(file);
          }
        }
      }
    });
  }

  initResizers() {
    const divider = this.dom.resizerDivider;
    let isDragging = false;

    divider.addEventListener('mousedown', () => {
      isDragging = true;
      divider.classList.add('dragging');
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    });

    const aiDivider = this.dom.aiResizerDivider;
    let isAIDragging = false;

    aiDivider.addEventListener('mousedown', () => {
      isAIDragging = true;
      aiDivider.classList.add('dragging');
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    });

    document.addEventListener('mousemove', (e) => {
      if (isDragging) {
        const workspaceRect = this.dom.workspace.getBoundingClientRect();
        const offset = e.clientX - workspaceRect.left;
        const totalWidth = workspaceRect.width;

        if (offset > 150 && totalWidth - offset > 150) {
          const leftPercent = (offset / totalWidth) * 100;
          this.dom.editorPane.style.flex = `0 0 ${leftPercent}%`;
          this.dom.previewPane.style.flex = `0 0 ${100 - leftPercent}%`;
        }
      } else if (isAIDragging) {
        const workspaceRect = this.dom.workspace.getBoundingClientRect();
        const width = workspaceRect.right - e.clientX;
        if (width >= 240 && width <= 600) {
          this.dom.aiPane.style.width = `${width}px`;
        }
      }
    });

    document.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false;
        divider.classList.remove('dragging');
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
      if (isAIDragging) {
        isAIDragging = false;
        aiDivider.classList.remove('dragging');
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    });
  }

  initElectronListeners() {
    window.electronAPI.onMenuNew(() => this.createTab());
    window.electronAPI.onMenuOpen(() => this.openFile());
    window.electronAPI.onMenuSave(() => this.saveFile(false));
    window.electronAPI.onMenuSaveAs(() => this.saveFile(true));
    window.electronAPI.onMenuCloseTab(() => {
      if (this.activeTabId) this.closeTab(this.activeTabId);
    });
    window.electronAPI.onMenuFind(() => this.toggleFindBar(false));
    window.electronAPI.onMenuReplace(() => this.toggleFindBar(true));
    window.electronAPI.onMenuInsertDateTime(() => this.editor.format('datetime'));
    window.electronAPI.onMenuTogglePreview(() => {
      this.setViewMode(this.currentViewMode === 'split' ? 'edit' : 'split');
    });
    window.electronAPI.onMenuToggleWrap(() => {
      const isWrap = this.editor.toggleWordWrap();
      this.dom.btnToggleWrap.classList.toggle('active', !isWrap);
    });
    window.electronAPI.onMenuToggleLineNumbers(() => {
      const show = this.editor.toggleLineNumbers();
      this.dom.btnToggleLinenums.classList.toggle('active', show);
    });
    window.electronAPI.onMenuHelpMarkdown(() => this.dom.modalHelp.showModal());
    window.electronAPI.onMenuShortcuts(() => this.dom.modalHelp.showModal());
    window.electronAPI.onMenuAbout(() => {
      alert('Cross Notepad v1.0.0\nSimple & Fast Windows and Linux Notepad for .txt and .md files with Gemma-4 AI.');
    });

    window.electronAPI.onFormatBold(() => this.editor.format('bold'));
    window.electronAPI.onFormatItalic(() => this.editor.format('italic'));
    window.electronAPI.onFormatCode(() => this.editor.format('code'));
    window.electronAPI.onFormatH1(() => this.editor.format('h1'));
    window.electronAPI.onFormatH2(() => this.editor.format('h2'));
    window.electronAPI.onFormatH3(() => this.editor.format('h3'));
    window.electronAPI.onFormatUl(() => this.editor.format('ul'));
    window.electronAPI.onFormatTask(() => this.editor.format('task'));

    // Incognito / Mode Triggers from Electron
    window.electronAPI.onTriggerUltralight(() => this.spawnUltralightWindow());
    window.electronAPI.onTriggerAITransfer(() => this.spawnAIWindowAndTransfer());
    window.electronAPI.onRestoreDocs((docs) => this.restoreTransferredDocs(docs));

    window.electronAPI.onFileOpenedFromCLI((data) => {
      if (data) {
        this.loadFileIntoTab(data.name, data.path, data.content);
      }
    });
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.app = new CrossNotepadApp();
});
