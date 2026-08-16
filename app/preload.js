const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  openFile: () => ipcRenderer.invoke('file:open-dialog'),
  saveFileAs: (data) => ipcRenderer.invoke('file:save-dialog', data),
  saveFile: (data) => ipcRenderer.invoke('file:write', data),
  readFile: (filePath) => ipcRenderer.invoke('file:read', filePath),
  confirmClose: (filename) => ipcRenderer.invoke('dialog:confirm-close', filename),
  saveSession: (data) => ipcRenderer.invoke('session:save', data),
  loadSession: () => ipcRenderer.invoke('session:load'),
  clearSession: () => ipcRenderer.invoke('session:clear'),
  getPlatform: () => ipcRenderer.invoke('app:get-platform'),
  getAIEnabled: () => ipcRenderer.invoke('app:get-ai-enabled'),
  ensureAIService: () => ipcRenderer.invoke('ai:ensure-service'),
  relaunchNoAI: () => ipcRenderer.invoke('app:relaunch-no-ai'),
  relaunchWithAI: () => ipcRenderer.invoke('app:relaunch-with-ai'),

  // Multi-window & Incognito Mode Handlers
  openUltralightWindow: (docs) => ipcRenderer.invoke('window:open-ultralight', docs),
  openAIWindowAndTransfer: (docs) => ipcRenderer.invoke('window:open-ai-and-transfer', docs),

  // Event Listeners from Native Menus or Window Events
  onMenuNew: (callback) => ipcRenderer.on('menu:new', callback),
  onMenuOpen: (callback) => ipcRenderer.on('menu:open', callback),
  onMenuSave: (callback) => ipcRenderer.on('menu:save', callback),
  onMenuSaveAs: (callback) => ipcRenderer.on('menu:save-as', callback),
  onMenuCloseTab: (callback) => ipcRenderer.on('menu:close-tab', callback),
  onMenuFind: (callback) => ipcRenderer.on('menu:find', callback),
  onMenuReplace: (callback) => ipcRenderer.on('menu:replace', callback),
  onMenuInsertDateTime: (callback) => ipcRenderer.on('menu:insert-datetime', callback),
  onMenuTogglePreview: (callback) => ipcRenderer.on('menu:toggle-preview', callback),
  onMenuToggleWrap: (callback) => ipcRenderer.on('menu:toggle-wrap', callback),
  onMenuToggleLineNumbers: (callback) => ipcRenderer.on('menu:toggle-linenumbers', callback),
  onMenuHelpMarkdown: (callback) => ipcRenderer.on('menu:help-markdown', callback),
  onMenuShortcuts: (callback) => ipcRenderer.on('menu:shortcuts', callback),
  onMenuAbout: (callback) => ipcRenderer.on('menu:about', callback),
  onFormatBold: (callback) => ipcRenderer.on('format:bold', callback),
  onFormatItalic: (callback) => ipcRenderer.on('format:italic', callback),
  onFormatCode: (callback) => ipcRenderer.on('format:code', callback),
  onFormatH1: (callback) => ipcRenderer.on('format:h1', callback),
  onFormatH2: (callback) => ipcRenderer.on('format:h2', callback),
  onFormatH3: (callback) => ipcRenderer.on('format:h3', callback),
  onFormatUl: (callback) => ipcRenderer.on('format:list', callback),
  onTriggerUltralight: (callback) => ipcRenderer.on('menu:trigger-ultralight', callback),
  onTriggerAITransfer: (callback) => ipcRenderer.on('menu:trigger-ai-transfer', callback),
  onRestoreDocs: (callback) => ipcRenderer.on('window:restore-docs', (event, docs) => callback(docs)),
  onFileOpenedFromCLI: (callback) => ipcRenderer.on('file:opened-from-cli', (event, data) => callback(data))
});
