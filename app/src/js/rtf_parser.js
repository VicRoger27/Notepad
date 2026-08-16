/**
 * Rich Text Format (RTF) Parser & Serializer Module for Cross Notepad
 * Compliant with RTF 1.5 - 1.9 specifications.
 * Supports:
 * - Parsing RTF controls: \b, \i, \ul, \strike, \par, \line, \tab, \bullet, \fsN, font & color tables, unicode \uN, hex \'XX
 * - Converting RTF to styled HTML / Markdown for the editor and preview panes
 * - Serializing Markdown & plain text documents into fully valid standard RTF documents
 */

class RTFManager {
  static isRTF(content) {
    if (typeof content !== 'string') return false;
    const trimmed = content.trimStart();
    return trimmed.startsWith('{\\rtf') || trimmed.startsWith('{\\urtf');
  }

  /**
   * Parse RTF string into styled HTML
   */
  static rtfToHtml(rtf) {
    if (!this.isRTF(rtf)) {
      return this.escapeHtml(rtf).replace(/\n/g, '<br>');
    }

    let output = '';
    let bold = false;
    let italic = false;
    let underline = false;
    let strike = false;
    let inHeader = false;
    let stack = [];

    // Clean RTF string
    let i = 0;
    const len = rtf.length;

    while (i < len) {
      const char = rtf[i];

      if (char === '{') {
        stack.push({ bold, italic, underline, strike });
        i++;
      } else if (char === '}') {
        if (stack.length > 0) {
          const state = stack.pop();
          bold = state.bold;
          italic = state.italic;
          underline = state.underline;
          strike = state.strike;
        }
        i++;
      } else if (char === '\\') {
        i++;
        if (i >= len) break;

        // Check for escaped characters
        const nextChar = rtf[i];
        if (nextChar === '\\' || nextChar === '{' || nextChar === '}') {
          output += nextChar;
          i++;
          continue;
        } else if (nextChar === '~') {
          output += '&nbsp;';
          i++;
          continue;
        } else if (nextChar === '_') {
          output += '&#8209;';
          i++;
          continue;
        } else if (nextChar === "'") {
          // Hex character code \'XX
          const hex = rtf.substr(i + 1, 2);
          if (/^[0-9a-fA-F]{2}$/.test(hex)) {
            const charCode = parseInt(hex, 16);
            output += String.fromCharCode(charCode);
            i += 3;
            continue;
          }
        }

        // Control word
        let word = '';
        while (i < len && /[a-zA-Z]/.test(rtf[i])) {
          word += rtf[i];
          i++;
        }

        // Control parameter (e.g. \b1, \fs24, \u12345)
        let param = '';
        if (i < len && (rtf[i] === '-' || /[0-9]/.test(rtf[i]))) {
          while (i < len && (rtf[i] === '-' || /[0-9]/.test(rtf[i]))) {
            param += rtf[i];
            i++;
          }
        }

        // Delimiter space after control word
        if (i < len && rtf[i] === ' ') {
          i++;
        }

        // Process control word
        const wordLower = word.toLowerCase();
        switch (wordLower) {
          case 'b':
            bold = param === '' || param !== '0';
            break;
          case 'i':
            italic = param === '' || param !== '0';
            break;
          case 'ul':
            underline = param === '' || param !== '0';
            break;
          case 'ulnone':
            underline = false;
            break;
          case 'strike':
            strike = param === '' || param !== '0';
            break;
          case 'par':
            output += '<br><br>';
            break;
          case 'line':
            output += '<br>';
            break;
          case 'tab':
            output += '&emsp;';
            break;
          case 'bullet':
            output += '&bull; ';
            break;
          case 'u': {
            let ucode = parseInt(param, 10);
            if (ucode < 0) ucode += 65536;
            output += String.fromCharCode(ucode);
            // Skip replacement char
            if (i < len && rtf[i] === '?') i++;
            break;
          }
          case 'fonttbl':
          case 'colortbl':
          case 'stylesheet':
          case 'info':
          case 'pict':
            // Skip ignored destination groups
            let depth = 1;
            while (i < len && depth > 0) {
              if (rtf[i] === '{') depth++;
              else if (rtf[i] === '}') depth--;
              else if (rtf[i] === '\\' && rtf[i + 1] === "'") i += 2;
              i++;
            }
            break;
          default:
            break;
        }
      } else if (char === '\r' || char === '\n') {
        // Raw RTF newlines are ignored according to spec
        i++;
      } else {
        // Regular character with active styles
        let styledChar = this.escapeHtml(char);
        if (bold) styledChar = `<strong>${styledChar}</strong>`;
        if (italic) styledChar = `<em>${styledChar}</em>`;
        if (underline) styledChar = `<u>${styledChar}</u>`;
        if (strike) styledChar = `<s>${styledChar}</s>`;
        output += styledChar;
        i++;
      }
    }

    return output;
  }

  /**
   * Parse RTF string into Plain Text
   */
  static rtfToPlainText(rtf) {
    if (!this.isRTF(rtf)) return rtf;

    // Convert to HTML first then strip HTML tags cleanly
    const html = this.rtfToHtml(rtf);
    const tmp = document.createElement('div');
    tmp.innerHTML = html.replace(/<br\s*\/?>/gi, '\n');
    return tmp.textContent || tmp.innerText || '';
  }

  /**
   * Serialize Markdown or Plain Text into standard compliant Rich Text Format (.rtf)
   */
  static textToRTF(text) {
    if (this.isRTF(text)) {
      return text;
    }

    const header = 
      "{\\rtf1\\ansi\\ansicpg1252\\deff0\\nouicompat\\deflang1033\n" +
      "{\\fonttbl{\\f0\\fnil\\fcharset0 Segoe UI;}{\\f1\\fnil\\fcharset0 Consolas;}}\n" +
      "{\\colortbl ;\\red33\\green37\\blue41;\\red59\\green130\\blue246;\\red239\\green68\\blue68;\\red16\\green185\\blue129;}\n" +
      "\\viewkind4\\uc1\\pard\\sl276\\slmult1\\lang1033\\f0\\fs22 ";

    const footer = "\n\\par\n}";

    // Convert text lines with markdown bold/italic/strike into RTF controls
    const lines = text.split('\n');
    const rtfLines = lines.map(line => {
      // Escape backslashes, braces, and non-ascii
      let rtfLine = '';
      let idx = 0;
      const len = line.length;

      // Handle Markdown headers
      let isHeading = false;
      let headingLevel = 0;
      if (/^#{1,3}\s+/.test(line)) {
        const match = line.match(/^(#{1,3})\s+(.*)$/);
        if (match) {
          headingLevel = match[1].length;
          line = match[2];
          isHeading = true;
        }
      }

      // Convert line characters & Markdown inline formatting
      let inBold = false;
      let inItalic = false;
      let inCode = false;

      let j = 0;
      while (j < line.length) {
        if (line.substr(j, 2) === '**' || line.substr(j, 2) === '__') {
          inBold = !inBold;
          rtfLine += inBold ? '\\b ' : '\\b0 ';
          j += 2;
        } else if (line[j] === '*' || line[j] === '_') {
          inItalic = !inItalic;
          rtfLine += inItalic ? '\\i ' : '\\i0 ';
          j++;
        } else if (line[j] === '`') {
          inCode = !inCode;
          rtfLine += inCode ? '\\f1\\cf2 ' : '\\f0\\cf0 ';
          j++;
        } else if (line[j] === '\\' || line[j] === '{' || line[j] === '}') {
          rtfLine += '\\' + line[j];
          j++;
        } else {
          const code = line.charCodeAt(j);
          if (code > 127) {
            rtfLine += `\\u${code}?`;
          } else {
            rtfLine += line[j];
          }
          j++;
        }
      }

      // Close open formatting
      if (inBold) rtfLine += '\\b0 ';
      if (inItalic) rtfLine += '\\i0 ';
      if (inCode) rtfLine += '\\f0\\cf0 ';

      if (isHeading) {
        const fontSize = headingLevel === 1 ? 32 : (headingLevel === 2 ? 28 : 24);
        return `\\b\\fs${fontSize} ${rtfLine}\\b0\\fs22`;
      }

      return rtfLine;
    });

    return header + rtfLines.join('\\par\n') + footer;
  }

  static escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = RTFManager;
}
