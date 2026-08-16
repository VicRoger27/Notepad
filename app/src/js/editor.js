/**
 * Editor Logic: Shortcuts, Formatting, Line Numbers, Find & Replace, Document Statistics, and Rainbow Caret
 */
class EditorController {
  constructor(textarea, lineNumbersEl, statusBarEls) {
    this.textarea = textarea;
    this.lineNumbersEl = lineNumbersEl;
    this.statusBarEls = statusBarEls || {};
    this.findMatches = [];
    this.currentMatchIndex = -1;
    this.isWordWrap = true;
    this.showLineNumbers = true;
    const savedSize = parseInt(localStorage.getItem('cross-notepad-font-size') || '16', 10);
    this.fontSize = Math.max(16, savedSize || 16);
    this.lineHeight = Math.round(this.fontSize * 1.625);

    this.initEvents();
    this.applyFontSize();

    // Blinking Cursor (Caret) Settings
    this.rainbowCaretEnabled = localStorage.getItem('cross-notepad-rainbow-caret') !== 'false'; // default true
    this.caretHueStep = parseInt(localStorage.getItem('cross-notepad-caret-step') || '10', 10); // default 10 deg
    this.staticCaretColor = localStorage.getItem('cross-notepad-static-caret') || '#38bdf8';

    this.initRainbowCaret();
    this.updateTheme(localStorage.getItem('cross-notepad-theme') || 'dark');
  }

  initRainbowCaret() {
    this.caretHue = 0;
    this.updateCaretColor();
    if (this.caretInterval) clearInterval(this.caretInterval);
    // Standard caret blink rate in Windows & Chromium is ~530ms.
    // Each blink tick advances the hue by the configured degree step (default 10 deg).
    this.caretInterval = setInterval(() => {
      if (!this.rainbowCaretEnabled) return;
      this.caretHue = (this.caretHue + this.caretHueStep) % 360;
      this.updateCaretColor();
    }, 530);
  }

  setRainbowCaretEnabled(enabled) {
    this.rainbowCaretEnabled = !!enabled;
    localStorage.setItem('cross-notepad-rainbow-caret', this.rainbowCaretEnabled ? 'true' : 'false');
    this.updateCaretColor();
  }

  setCaretHueStep(step) {
    this.caretHueStep = Math.max(1, Math.min(180, parseInt(step, 10) || 10));
    localStorage.setItem('cross-notepad-caret-step', this.caretHueStep.toString());
  }

  setStaticCaretColor(color) {
    this.staticCaretColor = color || '#38bdf8';
    localStorage.setItem('cross-notepad-static-caret', this.staticCaretColor);
    if (!this.rainbowCaretEnabled) {
      this.updateCaretColor();
    }
  }

  updateCaretColor() {
    let color;
    if (this.rainbowCaretEnabled) {
      color = `hsl(${this.caretHue}, 100%, 65%)`;
    } else {
      color = this.staticCaretColor || '#38bdf8';
    }
    this.textarea.style.setProperty('caret-color', color, 'important');
    document.documentElement.style.setProperty('--dynamic-caret-color', color);
  }

  updateTheme(themeName) {
    if (themeName === 'light') {
      this.textarea.style.setProperty('color', '#0f172a', 'important');
      this.textarea.style.setProperty('-webkit-text-fill-color', '#0f172a', 'important');
      this.textarea.style.backgroundColor = '#ffffff';
    } else if (themeName === 'sepia') {
      this.textarea.style.setProperty('color', '#24170e', 'important');
      this.textarea.style.setProperty('-webkit-text-fill-color', '#24170e', 'important');
      this.textarea.style.backgroundColor = '#fbf7ee';
    } else if (themeName === 'nord') {
      this.textarea.style.setProperty('color', '#f8fafc', 'important');
      this.textarea.style.setProperty('-webkit-text-fill-color', '#f8fafc', 'important');
      this.textarea.style.backgroundColor = '#242933';
    } else {
      // dark default - softened high-contrast silver, regular weight
      this.textarea.style.setProperty('color', '#e2e8f0', 'important');
      this.textarea.style.setProperty('-webkit-text-fill-color', '#e2e8f0', 'important');
      this.textarea.style.setProperty('font-weight', '400', 'important');
      this.textarea.style.backgroundColor = '#141418';
    }
    this.updateCaretColor();
    this.updateLineNumbers();
  }

  applyFontSize() {
    this.lineHeight = Math.round(this.fontSize * 1.625);
    this.textarea.style.fontSize = `${this.fontSize}px`;
    this.textarea.style.lineHeight = `${this.lineHeight}px`;
    if (this.lineNumbersEl) {
      this.lineNumbersEl.style.fontSize = `${Math.max(12, this.fontSize - 2)}px`;
    }
    localStorage.setItem('cross-notepad-font-size', this.fontSize);
    this.updateLineNumbers();
  }

  zoomIn() {
    this.setFontSize(this.fontSize + 1);
  }

  zoomOut() {
    this.setFontSize(this.fontSize - 1);
  }

  resetZoom() {
    this.setFontSize(16);
  }

  setFontSize(size) {
    this.fontSize = Math.max(12, Math.min(36, size));
    this.applyFontSize();
  }

  initEvents() {
    this.textarea.addEventListener('input', () => {
      this.updateLineNumbers();
      this.updateStats();
    });

    this.textarea.addEventListener('keyup', () => {
      this.updateCursorPos();
    });

    this.textarea.addEventListener('click', () => {
      this.updateCursorPos();
    });

    this.textarea.addEventListener('scroll', () => {
      if (this.lineNumbersEl) {
        this.lineNumbersEl.scrollTop = this.textarea.scrollTop;
      }
    });

    // Zoom on Ctrl+MouseWheel
    this.textarea.addEventListener('wheel', (e) => {
      if (e.ctrlKey) {
        e.preventDefault();
        if (e.deltaY < 0) {
          this.zoomIn();
        } else {
          this.zoomOut();
        }
      }
    }, { passive: false });

    if (window.ResizeObserver) {
      this.resizeObserver = new ResizeObserver(() => {
        this.updateLineNumbers();
      });
      this.resizeObserver.observe(this.textarea);
    } else {
      window.addEventListener('resize', () => this.updateLineNumbers());
    }

    // Smart key handling
    this.textarea.addEventListener('keydown', (e) => this.handleKeyDown(e));
  }

  handleKeyDown(e) {
    const textarea = this.textarea;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const val = textarea.value;

    // Tab key -> insert 2 spaces (or indent)
    if (e.key === 'Tab') {
      e.preventDefault();
      if (!e.shiftKey) {
        // Simple insert 2 spaces
        this.insertTextAtCursor('  ');
      } else {
        // Shift+Tab -> Outdent line
        this.outdentLine();
      }
      return;
    }

    // Auto-closing quotes and brackets
    const pairs = {
      '(': ')',
      '[': ']',
      '{': '}',
      '"': '"',
      "'": "'",
      '`': '`'
    };

    if (pairs[e.key]) {
      const openChar = e.key;
      const closeChar = pairs[openChar];

      if (start !== end) {
        // Wrap selected text
        e.preventDefault();
        const selected = val.substring(start, end);
        const replacement = `${openChar}${selected}${closeChar}`;
        this.replaceSelection(replacement, start + 1, end + 1);
        return;
      } else if (openChar === closeChar && val.charAt(start) === closeChar) {
        // Skip over closing quote if already typed
        e.preventDefault();
        textarea.selectionStart = textarea.selectionEnd = start + 1;
        return;
      } else {
        // Auto-insert pair
        e.preventDefault();
        this.insertTextAtCursor(`${openChar}${closeChar}`);
        textarea.selectionStart = textarea.selectionEnd = start + 1;
        return;
      }
    }

    // Enter key -> Smart list continuation & auto scroll
    if (e.key === 'Enter') {
      setTimeout(() => this.scrollToCursor(true), 10);
      const lineStart = val.lastIndexOf('\n', start - 1) + 1;
      const currentLine = val.substring(lineStart, start);

      const taskMatch = currentLine.match(/^(\s*)([-*+]\s+\[[ x]\]\s+)/);
      const bulletMatch = currentLine.match(/^(\s*)([-*+]\s+)/);
      const numberMatch = currentLine.match(/^(\s*)(\d+)\.\s+/);

      if (taskMatch) {
        const indent = taskMatch[1];
        const prefix = taskMatch[2];
        const textAfterPrefix = currentLine.substring(indent.length + prefix.length).trim();
        if (textAfterPrefix === '') {
          e.preventDefault();
          this.setLineContent(lineStart, start, '');
          return;
        }
        e.preventDefault();
        this.insertTextAtCursor(`\n${indent}- [ ] `);
        return;
      } else if (bulletMatch && !currentLine.includes('[')) {
        const indent = bulletMatch[1];
        const prefix = bulletMatch[2];
        const textAfterPrefix = currentLine.substring(indent.length + prefix.length).trim();
        if (textAfterPrefix === '') {
          e.preventDefault();
          this.setLineContent(lineStart, start, '');
          return;
        }
        e.preventDefault();
        this.insertTextAtCursor(`\n${indent}${prefix}`);
        return;
      } else if (numberMatch) {
        const indent = numberMatch[1];
        const num = parseInt(numberMatch[0].trim(), 10);
        const prefixLen = numberMatch[0].length;
        const textAfterPrefix = currentLine.substring(prefixLen).trim();
        if (textAfterPrefix === '') {
          e.preventDefault();
          this.setLineContent(lineStart, start, '');
          return;
        }
        e.preventDefault();
        this.insertTextAtCursor(`\n${indent}${num + 1}. `);
        return;
      }
    }
  }

  scrollToCursor(center = true) {
    const textarea = this.textarea;
    if (!textarea) return;

    requestAnimationFrame(() => {
      const pos = textarea.selectionStart || 0;
      const textBefore = textarea.value.substring(0, pos);
      const paragraphs = textBefore.split('\n');
      const lh = this.lineHeight || 24;
      
      let visualLineIndex = 0;
      if (!this.isWordWrap) {
        visualLineIndex = Math.max(0, paragraphs.length - 1);
      } else {
        this.ensureMirrorEl();
        for (let i = 0; i < paragraphs.length - 1; i++) {
          const para = paragraphs[i];
          if (para.length > 0) {
            this.mirrorEl.textContent = para;
            visualLineIndex += Math.max(1, Math.round((this.mirrorEl.offsetHeight || lh) / lh));
          } else {
            visualLineIndex += 1;
          }
        }
        const lastPara = paragraphs[paragraphs.length - 1];
        if (lastPara.length > 0) {
          this.mirrorEl.textContent = lastPara;
          visualLineIndex += Math.max(0, Math.round((this.mirrorEl.offsetHeight || lh) / lh) - 1);
        }
      }

      const paddingTop = 12;
      const cursorY = paddingTop + (visualLineIndex * lh);
      const viewportHeight = textarea.clientHeight;

      if (center) {
        const targetScroll = Math.max(0, cursorY - (viewportHeight * 0.45));
        if (targetScroll > textarea.scrollTop || cursorY > textarea.scrollTop + (viewportHeight * 0.5)) {
          textarea.scrollTop = targetScroll;
        }
      } else {
        const currentScroll = textarea.scrollTop;
        if (cursorY < currentScroll + 30) {
          textarea.scrollTop = Math.max(0, cursorY - 30);
        } else if (cursorY > currentScroll + viewportHeight - 60) {
          textarea.scrollTop = cursorY - viewportHeight + 60;
        }
      }

      if (this.lineNumbersEl) {
        this.lineNumbersEl.scrollTop = textarea.scrollTop;
      }
    });
  }

  insertTextAtCursor(text) {
    const textarea = this.textarea;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const val = textarea.value;

    textarea.value = val.substring(0, start) + text + val.substring(end);
    textarea.selectionStart = textarea.selectionEnd = start + text.length;
    this.updateLineNumbers();
    this.updateStats();
    if (text.includes('\n')) {
      this.scrollToCursor(true);
    }
    textarea.dispatchEvent(new Event('input'));
  }

  replaceSelection(replacement, newStart, newEnd) {
    const textarea = this.textarea;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const val = textarea.value;

    textarea.value = val.substring(0, start) + replacement + val.substring(end);
    textarea.selectionStart = newStart !== undefined ? newStart : start + replacement.length;
    textarea.selectionEnd = newEnd !== undefined ? newEnd : start + replacement.length;
    this.updateLineNumbers();
    this.updateStats();
    textarea.dispatchEvent(new Event('input'));
  }

  setLineContent(start, end, content) {
    const textarea = this.textarea;
    const val = textarea.value;
    textarea.value = val.substring(0, start) + content + val.substring(end);
    textarea.selectionStart = textarea.selectionEnd = start + content.length;
    this.updateLineNumbers();
    this.updateStats();
    textarea.dispatchEvent(new Event('input'));
  }

  outdentLine() {
    const textarea = this.textarea;
    const start = textarea.selectionStart;
    const val = textarea.value;
    const lineStart = val.lastIndexOf('\n', start - 1) + 1;
    const line = val.substring(lineStart);

    if (line.startsWith('  ')) {
      textarea.value = val.substring(0, lineStart) + val.substring(lineStart + 2);
      textarea.selectionStart = textarea.selectionEnd = Math.max(lineStart, start - 2);
      this.updateLineNumbers();
      this.updateStats();
      textarea.dispatchEvent(new Event('input'));
    }
  }

  // Formatting actions
  format(action) {
    const textarea = this.textarea;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const val = textarea.value;
    const selected = val.substring(start, end);

    switch (action) {
      case 'bold':
        this.wrapOrInsert('**', '**', 'bold text');
        break;
      case 'italic':
        this.wrapOrInsert('*', '*', 'italic text');
        break;
      case 'strikethrough':
        this.wrapOrInsert('~~', '~~', 'strikethrough text');
        break;
      case 'code':
        this.wrapOrInsert('`', '`', 'code');
        break;
      case 'codeblock':
        if (selected) {
          this.wrapOrInsert('```\n', '\n```', selected);
        } else {
          this.insertTextAtCursor('```javascript\n// code here\n```\n');
        }
        break;
      case 'h1':
      case 'h2':
      case 'h3':
      case 'ul':
      case 'ol':
      case 'task':
      case 'quote':
        this.toggleLinePrefix(action);
        break;
      case 'link':
        if (selected) {
          this.replaceSelection(`[${selected}](https://example.com)`);
        } else {
          this.insertTextAtCursor('[link title](https://example.com)');
        }
        break;
      case 'image':
        if (selected) {
          this.replaceSelection(`![${selected}](https://example.com/image.png)`);
        } else {
          this.insertTextAtCursor('![alt text](https://example.com/image.png)');
        }
        break;
      case 'datetime':
        const now = new Date();
        const dateStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ' + now.toLocaleDateString();
        this.insertTextAtCursor(dateStr);
        break;
      case 'table':
        const tableTemplate =
          `\n| Column 1 | Column 2 | Column 3 |\n` +
          `| -------- | -------- | -------- |\n` +
          `| Item 1   | Value A  | Notes    |\n` +
          `| Item 2   | Value B  | Notes    |\n\n`;
        this.insertTextAtCursor(tableTemplate);
        break;
    }
  }

  toggleLinePrefix(type) {
    const textarea = this.textarea;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const val = textarea.value;
    const hadSelection = (start !== end);

    const lineStart = val.lastIndexOf('\n', start - 1) + 1;
    let lineEnd = val.indexOf('\n', end);
    if (lineEnd === -1) lineEnd = val.length;

    const selectedText = val.substring(lineStart, lineEnd);
    const lines = selectedText.split('\n');

    let counter = 1;
    let singleLineDelta = 0;

    const processedLines = lines.map((line, idx) => {
      const match = line.match(/^(\s*)(#{1,6}\s+|[-*+]\s+\[[ x]\]\s+|[-*+]\s+|\d+\.\s+|>+\s+)?(.*)$/);
      const indent = match ? match[1] : '';
      const existingPrefix = match ? match[2] || '' : '';
      const content = match ? match[3] : line;

      let targetPrefix = '';
      if (type === 'ul') targetPrefix = '- ';
      else if (type === 'ol') targetPrefix = `${counter++}. `;
      else if (type === 'task') targetPrefix = '- [ ] ';
      else if (type === 'quote') targetPrefix = '> ';
      else if (type === 'h1') targetPrefix = '# ';
      else if (type === 'h2') targetPrefix = '## ';
      else if (type === 'h3') targetPrefix = '### ';

      let newLine = '';
      // Toggle off if already matching exact prefix
      if (existingPrefix.trim() === targetPrefix.trim()) {
        newLine = indent + content;
      } else {
        newLine = indent + targetPrefix + content;
      }

      if (idx === 0) {
        singleLineDelta = newLine.length - line.length;
      }
      return newLine;
    });

    const replacement = processedLines.join('\n');
    textarea.value = val.substring(0, lineStart) + replacement + val.substring(lineEnd);

    if (hadSelection) {
      textarea.selectionStart = lineStart;
      textarea.selectionEnd = lineStart + replacement.length;
    } else {
      const newPos = Math.max(lineStart, start + singleLineDelta);
      textarea.selectionStart = textarea.selectionEnd = newPos;
    }

    this.updateLineNumbers();
    this.updateStats();
    textarea.dispatchEvent(new Event('input'));
  }

  // RTF Formatting actions
  formatRTF(action, payload = {}) {
    const textarea = this.textarea;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const val = textarea.value;
    const selected = val.substring(start, end);

    switch (action) {
      case 'bold':
        this.wrapOrInsert('\\b ', '\\b0', selected || 'bold text');
        break;
      case 'italic':
        this.wrapOrInsert('\\i ', '\\i0', selected || 'italic text');
        break;
      case 'underline':
        this.wrapOrInsert('\\ul ', '\\ulnone', selected || 'underlined text');
        break;
      case 'strikethrough':
        this.wrapOrInsert('\\strike ', '\\strike0', selected || 'strike text');
        break;
      case 'align-left':
        this.prefixCurrentLine('\\ql ');
        break;
      case 'align-center':
        this.prefixCurrentLine('\\qc ');
        break;
      case 'align-right':
        this.prefixCurrentLine('\\qr ');
        break;
      case 'align-justify':
        this.prefixCurrentLine('\\qj ');
        break;
      case 'color':
        if (payload.colorIndex) {
          this.wrapOrInsert(`\\cf${payload.colorIndex} `, '\\cf0', selected || 'colored text');
        }
        break;
      case 'bullet':
        this.prefixCurrentLine('{\\pntext\\bullet\\tab}{\\*\\pn\\pnlvlblt\\pnf1\\pnindent0{\\pntxtb\\bullet}}\\fi-360\\li360 ');
        break;
      case 'heading':
        const level = payload.level || 1;
        const fontSize = level === 1 ? '36' : (level === 2 ? '28' : '24');
        this.wrapOrInsert(`{\\b\\fs${fontSize} `, '}\\par', selected || `Heading ${level}`);
        break;
      case 'paragraph':
        this.insertTextAtCursor('\\par\n');
        break;
      case 'divider':
        this.insertTextAtCursor('\n\\pard\\brdrb\\brdrs\\brdrw10\\brsp20 \\par\\pard\n');
        break;
      case 'font-family':
        if (payload.font) {
          this.wrapOrInsert(`{\\fonttbl{\\f0 ${payload.font};}}\\f0 `, '', selected || '');
        }
        break;
      case 'font-size':
        const size = payload.size || '24';
        this.wrapOrInsert(`{\\fs${size} `, '}', selected || `size ${Math.round(size / 2)}pt text`);
        break;
    }
  }

  wrapOrInsert(before, after, defaultText) {
    const textarea = this.textarea;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const val = textarea.value;

    if (start !== end) {
      const selected = val.substring(start, end);
      if (
        selected.startsWith(before) &&
        selected.endsWith(after) &&
        selected.length >= before.length + after.length
      ) {
        const unwrapped = selected.substring(before.length, selected.length - after.length);
        this.replaceSelection(unwrapped, start, start + unwrapped.length);
        return;
      }
      const replacement = `${before}${selected}${after}`;
      this.replaceSelection(replacement, start, start + replacement.length);
    } else {
      const replacement = `${before}${defaultText}${after}`;
      this.replaceSelection(replacement, start + before.length, start + before.length + defaultText.length);
    }
  }

  prefixCurrentLine(prefix) {
    const textarea = this.textarea;
    const start = textarea.selectionStart;
    const val = textarea.value;
    const lineStart = val.lastIndexOf('\n', start - 1) + 1;

    textarea.value = val.substring(0, lineStart) + prefix + val.substring(lineStart);
    textarea.selectionStart = textarea.selectionEnd = start + prefix.length;
    this.updateLineNumbers();
    this.updateStats();
    textarea.dispatchEvent(new Event('input'));
  }

  ensureMirrorEl() {
    const lh = this.lineHeight || 26;
    const fs = this.fontSize || 16;
    if (!this.mirrorEl) {
      this.mirrorEl = document.createElement('div');
      this.mirrorEl.className = 'textarea-mirror';
      this.mirrorEl.style.cssText = `
        position: absolute;
        top: -99999px;
        left: -99999px;
        visibility: hidden;
        pointer-events: none;
        box-sizing: border-box;
        font-family: var(--font-mono);
        font-size: ${fs}px;
        line-height: ${lh}px;
        white-space: pre-wrap;
        word-break: break-word;
        tab-size: 2;
        padding: 0;
        margin: 0;
        border: none;
      `;
      document.body.appendChild(this.mirrorEl);
    }
    const computed = window.getComputedStyle(this.textarea);
    const paddingLeft = parseFloat(computed.paddingLeft) || 16;
    const paddingRight = parseFloat(computed.paddingRight) || 16;
    const width = this.textarea.clientWidth - (paddingLeft + paddingRight);
    this.mirrorEl.style.width = Math.max(10, width) + 'px';
    this.mirrorEl.style.fontFamily = computed.fontFamily;
    this.mirrorEl.style.fontSize = `${fs}px`;
    this.mirrorEl.style.lineHeight = `${lh}px`;
    this.mirrorEl.style.letterSpacing = computed.letterSpacing;
    if (this.isWordWrap) {
      this.mirrorEl.style.whiteSpace = 'pre-wrap';
      this.mirrorEl.style.wordBreak = 'break-word';
    } else {
      this.mirrorEl.style.whiteSpace = 'pre';
      this.mirrorEl.style.wordBreak = 'normal';
    }
  }

  getStepClass(num) {
    if (num % 100 === 0) return 'step-100'; // #FF1166 (pink-ish)
    if (num % 50 === 0) return 'step-50';   // #FFAA11 (yellow)
    if (num % 10 === 0) return 'step-10';   // #11FFAA (turquoise)
    if (num % 5 === 0) return 'step-5';     // #38bdf8 (Bright Sky Blue)
    return '';
  }

  // Line Numbers (every visual line row gets its own counted line number with milestone coloring)
  updateLineNumbers() {
    if (!this.lineNumbersEl || !this.showLineNumbers) return;
    const text = this.textarea.value;
    const paragraphs = text.split('\n');
    const lh = this.lineHeight || 26;

    let totalVisualLines = 0;
    let html = '';

    if (!this.isWordWrap) {
      totalVisualLines = paragraphs.length;
      for (let i = 1; i <= totalVisualLines; i++) {
        const cls = this.getStepClass(i);
        html += `<div class="line-num${cls ? ' ' + cls : ''}" style="height:${lh}px;min-height:${lh}px;max-height:${lh}px;line-height:${lh}px;">${i}</div>`;
      }
    } else {
      this.ensureMirrorEl();
      let currentNumber = 1;

      for (let i = 0; i < paragraphs.length; i++) {
        const para = paragraphs[i];
        let rows = 1;
        if (para.length > 0) {
          this.mirrorEl.textContent = para;
          const h = this.mirrorEl.offsetHeight || lh;
          rows = Math.max(1, Math.round(h / lh));
        }

        for (let r = 0; r < rows; r++) {
          const num = currentNumber++;
          const cls = this.getStepClass(num);
          html += `<div class="line-num${cls ? ' ' + cls : ''}" style="height:${lh}px;min-height:${lh}px;max-height:${lh}px;line-height:${lh}px;">${num}</div>`;
        }
      }
      totalVisualLines = currentNumber - 1;
    }

    if (totalVisualLines >= 1000) {
      this.lineNumbersEl.style.width = '56px';
      this.lineNumbersEl.style.minWidth = '56px';
    } else if (totalVisualLines >= 100) {
      this.lineNumbersEl.style.width = '48px';
      this.lineNumbersEl.style.minWidth = '48px';
    } else {
      this.lineNumbersEl.style.width = '44px';
      this.lineNumbersEl.style.minWidth = '44px';
    }

    this.lineNumbersEl.innerHTML = html;
    this.lineNumbersEl.scrollTop = this.textarea.scrollTop;
  }

  toggleLineNumbers(force) {
    this.showLineNumbers = force !== undefined ? force : !this.showLineNumbers;
    if (this.lineNumbersEl) {
      this.lineNumbersEl.classList.toggle('hidden', !this.showLineNumbers);
    }
    if (this.showLineNumbers) {
      this.updateLineNumbers();
    }
    return this.showLineNumbers;
  }

  toggleWordWrap(force) {
    this.isWordWrap = force !== undefined ? force : !this.isWordWrap;
    this.textarea.classList.toggle('no-wrap', !this.isWordWrap);
    this.updateLineNumbers();
    return this.isWordWrap;
  }

  // Document Statistics & Cursor Position
  updateCursorPos() {
    if (!this.statusBarEls.cursorPos) return;
    const textarea = this.textarea;
    const pos = textarea.selectionStart;
    const textBefore = textarea.value.substring(0, pos);
    const lines = textBefore.split('\n');
    const lineNum = lines.length;
    const colNum = lines[lines.length - 1].length + 1;
    this.statusBarEls.cursorPos.textContent = `Ln ${lineNum}, Col ${colNum}`;
  }

  updateStats() {
    const text = this.textarea.value;
    const charCount = text.length;
    const words = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
    const readingTime = Math.ceil(words / 200);

    if (this.statusBarEls.wordCount) {
      this.statusBarEls.wordCount.textContent = `${words.toLocaleString()} words`;
    }
    if (this.statusBarEls.charCount) {
      this.statusBarEls.charCount.textContent = `${charCount.toLocaleString()} chars`;
    }
    if (this.statusBarEls.readingTime) {
      this.statusBarEls.readingTime.textContent = `~${readingTime} min read`;
    }
    this.updateCursorPos();
  }

  // Find & Replace Engine
  find(query, options = {}) {
    if (!query) {
      this.findMatches = [];
      this.currentMatchIndex = -1;
      return { count: 0, index: -1 };
    }

    const { matchCase = false, isRegex = false } = options;
    const text = this.textarea.value;
    this.findMatches = [];

    try {
      if (isRegex) {
        const flags = matchCase ? 'g' : 'gi';
        const regex = new RegExp(query, flags);
        let match;
        while ((match = regex.exec(text)) !== null) {
          this.findMatches.push({ start: match.index, end: match.index + match[0].length });
          if (match.index === regex.lastIndex) regex.lastIndex++;
        }
      } else {
        const searchText = matchCase ? text : text.toLowerCase();
        const target = matchCase ? query : query.toLowerCase();
        let idx = searchText.indexOf(target);
        while (idx !== -1) {
          this.findMatches.push({ start: idx, end: idx + target.length });
          idx = searchText.indexOf(target, idx + 1);
        }
      }
    } catch (err) {
      console.warn('Regex error:', err);
    }

    if (this.findMatches.length > 0) {
      this.currentMatchIndex = 0;
      this.highlightMatch(this.currentMatchIndex);
    } else {
      this.currentMatchIndex = -1;
    }

    return {
      count: this.findMatches.length,
      index: this.currentMatchIndex
    };
  }

  findNext() {
    if (this.findMatches.length === 0) return { count: 0, index: -1 };
    this.currentMatchIndex = (this.currentMatchIndex + 1) % this.findMatches.length;
    this.highlightMatch(this.currentMatchIndex);
    return { count: this.findMatches.length, index: this.currentMatchIndex };
  }

  findPrev() {
    if (this.findMatches.length === 0) return { count: 0, index: -1 };
    this.currentMatchIndex = (this.currentMatchIndex - 1 + this.findMatches.length) % this.findMatches.length;
    this.highlightMatch(this.currentMatchIndex);
    return { count: this.findMatches.length, index: this.currentMatchIndex };
  }

  highlightMatch(index) {
    if (index >= 0 && index < this.findMatches.length) {
      const match = this.findMatches[index];
      this.textarea.focus();
      this.textarea.setSelectionRange(match.start, match.end);
      
      // Ensure cursor scroll into view
      const textBefore = this.textarea.value.substring(0, match.start);
      const lineNum = textBefore.split('\n').length;
      const lineHeight = 21; // approximate line height in px
      this.textarea.scrollTop = Math.max(0, (lineNum - 3) * lineHeight);
    }
  }

  replaceOne(replacementText) {
    if (this.currentMatchIndex === -1 || this.findMatches.length === 0) return;
    const match = this.findMatches[this.currentMatchIndex];
    this.textarea.setSelectionRange(match.start, match.end);
    this.replaceSelection(replacementText);
  }

  replaceAll(query, replacementText, options = {}) {
    const { matchCase = false, isRegex = false } = options;
    const text = this.textarea.value;
    let newText;

    if (isRegex) {
      const flags = matchCase ? 'g' : 'gi';
      const regex = new RegExp(query, flags);
      newText = text.replace(regex, replacementText);
    } else {
      if (matchCase) {
        newText = text.split(query).join(replacementText);
      } else {
        const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
        newText = text.replace(regex, replacementText);
      }
    }

    this.textarea.value = newText;
    this.updateLineNumbers();
    this.updateStats();
    this.textarea.dispatchEvent(new Event('input'));
  }
}
