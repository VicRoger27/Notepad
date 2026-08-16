/**
 * Markdown Rendering & Synchronized Scrolling
 */
const MarkdownManager = (() => {
  let isConfigured = false;

  function init() {
    if (typeof marked !== 'undefined') {
      try {
        if (typeof marked.use === 'function') {
          marked.use({
            gfm: true,
            breaks: true,
            pedantic: false
          });
        } else if (typeof marked.setOptions === 'function') {
          marked.setOptions({
            gfm: true,
            breaks: true,
            pedantic: false,
            headerIds: true
          });
        }
      } catch (err) {
        console.warn('Marked configuration warning:', err);
      }
      isConfigured = true;
    }
  }

  function render(markdownText) {
    if (!isConfigured) init();
    if (typeof marked === 'undefined') {
      return `<div style="white-space: pre-wrap;">${escapeHtml(markdownText)}</div>`;
    }
    try {
      if (typeof marked.parse === 'function') {
        return marked.parse(markdownText || '', { gfm: true, breaks: true });
      }
      if (typeof marked === 'function') {
        return marked(markdownText || '', { gfm: true, breaks: true });
      }
      return `<div style="white-space: pre-wrap;">${escapeHtml(markdownText)}</div>`;
    } catch (e) {
      console.error('Markdown render error:', e);
      return `<div style="white-space: pre-wrap;">${escapeHtml(markdownText)}</div>`;
    }
  }

  function escapeHtml(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  }

  // Synchronize scrolling between editor textarea and preview container
  let isScrollingEditor = false;
  let isScrollingPreview = false;

  function setupScrollSync(editorEl, previewEl) {
    if (!editorEl || !previewEl) return;

    editorEl.addEventListener('scroll', () => {
      if (isScrollingPreview) return;
      isScrollingEditor = true;
      const percentage = editorEl.scrollTop / (editorEl.scrollHeight - editorEl.clientHeight || 1);
      previewEl.scrollTop = percentage * (previewEl.scrollHeight - previewEl.clientHeight);
      setTimeout(() => { isScrollingEditor = false; }, 50);
    });

    previewEl.addEventListener('scroll', () => {
      if (isScrollingEditor) return;
      isScrollingPreview = true;
      const percentage = previewEl.scrollTop / (previewEl.scrollHeight - previewEl.clientHeight || 1);
      editorEl.scrollTop = percentage * (editorEl.scrollHeight - editorEl.clientHeight);
      setTimeout(() => { isScrollingPreview = false; }, 50);
    });
  }

  return {
    init,
    render,
    setupScrollSync
  };
})();
