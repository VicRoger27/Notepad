const { app, BrowserWindow, ipcMain, dialog, Menu, nativeTheme, globalShortcut } = require('electron');
const path = require('path');
const fs = require('fs').promises;
const { spawn } = require('child_process');

app.name = 'Cross Notepad';
app.setName('Cross Notepad');
if (process.platform === 'win32') {
  app.setAppUserModelId('com.vopple.crossnotepad');
}

let windows = new Set();
let aiProcess = null;

async function isAIEnabled() {
  if (process.argv.includes('--no-ai')) {
    return false;
  }
  try {
    const configPath = path.join(__dirname, '..', 'config', 'ai_config.json');
    const raw = await fs.readFile(configPath, 'utf8');
    const cfg = JSON.parse(raw);
    return cfg.enabled !== false;
  } catch (e) {
    return true;
  }
}

async function setAIConfig(enabled) {
  try {
    const configDir = path.join(__dirname, '..', 'config');
    await fs.mkdir(configDir, { recursive: true });
    const configPath = path.join(configDir, 'ai_config.json');
    const cfg = {
      enabled: !!enabled,
      model_name: 'gemma4-e2b-it',
      model_path: 'C:\\Users\\kosti\\AI Models\\gemma4-e2b-it',
      auto_start_service: !!enabled,
      port: 4141
    };
    await fs.writeFile(configPath, JSON.stringify(cfg, null, 2), 'utf8');
  } catch (e) {
    console.warn('[Electron] Could not write ai_config.json:', e.message);
  }
}

async function startAIService() {
  const enabled = await isAIEnabled();
  if (!enabled) {
    console.log('[Electron] Running in Ultralight Mode (Gemma LLM disabled).');
    return;
  }

  // Check if AI server is already responsive on port 4141
  try {
    const http = require('http');
    const req = http.get('http://127.0.0.1:4141/api/status', (res) => {
      console.log('[Electron] AI service already active.');
    });
    req.on('error', () => {
      spawnAIServiceWorker();
    });
  } catch (e) {
    spawnAIServiceWorker();
  }
}

function spawnAIServiceWorker() {
  const pythonCmds = process.platform === 'win32'
    ? ['py', 'python', 'C:\\Users\\kosti\\AppData\\Local\\Programs\\Python\\Python312\\python.exe']
    : ['python3', 'python'];

  const aiScript = path.join(__dirname, 'ai_service.py');

  for (const cmd of pythonCmds) {
    try {
      aiProcess = spawn(cmd, [aiScript], {
        detached: false,
        stdio: 'ignore',
        windowsHide: true
      });

      aiProcess.on('error', () => {});
      if (aiProcess.pid) {
        console.log(`[Electron] Auto-spawned background AI service with PID ${aiProcess.pid}`);
        break;
      }
    } catch (e) {
      // Try next python command
    }
  }
}

function createNotepadWindow(options = {}) {
  const mode = options.mode || 'ai';
  const docs = options.docs || null;

  const iconPath = process.platform === 'win32'
    ? path.join(__dirname, 'src', 'icons', 'icon.ico')
    : path.join(__dirname, 'src', 'icons', 'icon.png');

  const win = new BrowserWindow({
    width: 1050,
    height: 720,
    minWidth: 500,
    minHeight: 400,
    title: mode === 'ultralight' ? 'Cross Notepad (Incognito Mode - No LLM)' : 'Cross Notepad',
    icon: iconPath,
    backgroundColor: nativeTheme.shouldUseDarkColors ? '#1e1e24' : '#ffffff',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      spellcheck: true
    }
  });

  windows.add(win);
  win.on('closed', () => {
    windows.delete(win);
  });

  win.loadFile(path.join(__dirname, 'src', 'index.html'), { query: { mode: mode } });

  // Handle CLI argument file opening on first window
  const args = process.argv.slice(app.isPackaged ? 1 : 2);
  const filePathArg = args.find(arg => !arg.startsWith('--') && !arg.startsWith('-'));

  win.webContents.once('did-finish-load', async () => {
    if (docs && Array.isArray(docs) && docs.length > 0) {
      win.webContents.send('window:restore-docs', docs);
    } else if (filePathArg && windows.size === 1) {
      try {
        const resolvedPath = path.resolve(filePathArg);
        const stats = await fs.stat(resolvedPath);
        if (stats.isFile()) {
          const content = await readTextFileUniversal(resolvedPath);
          win.webContents.send('file:opened-from-cli', {
            path: resolvedPath,
            name: path.basename(resolvedPath),
            content: content
          });
        }
      } catch (err) {
        console.error('Failed to open file from argument:', err);
      }
    }
  });

  return win;
}

function buildMenu() {
  const menuTemplate = [
    {
      label: '&File',
      submenu: [
        {
          label: '&New File',
          accelerator: 'CmdOrCtrl+N',
          click: (m, win) => win && win.webContents.send('menu:new')
        },
        {
          label: 'New &Incognito Window (No LLM)',
          accelerator: 'CmdOrCtrl+Shift+X',
          click: (m, win) => {
            if (win) {
              win.webContents.send('menu:trigger-ultralight');
            } else {
              createNotepadWindow({ mode: 'ultralight' });
            }
          }
        },
        {
          label: '&Open...',
          accelerator: 'CmdOrCtrl+O',
          click: (m, win) => win && win.webContents.send('menu:open')
        },
        { type: 'separator' },
        {
          label: '&Save',
          accelerator: 'CmdOrCtrl+S',
          click: (m, win) => win && win.webContents.send('menu:save')
        },
        {
          label: 'Save &As...',
          accelerator: 'CmdOrCtrl+Shift+S',
          click: (m, win) => win && win.webContents.send('menu:save-as')
        },
        { type: 'separator' },
        {
          label: 'Close Tab',
          accelerator: 'CmdOrCtrl+W',
          click: (m, win) => win && win.webContents.send('menu:close-tab')
        },
        { type: 'separator' },
        {
          label: 'E&xit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Alt+F4',
          click: () => app.quit()
        }
      ]
    },
    {
      label: '&Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
        { type: 'separator' },
        {
          label: '&Find',
          accelerator: 'CmdOrCtrl+F',
          click: (m, win) => win && win.webContents.send('menu:find')
        },
        {
          label: 'Find and &Replace',
          accelerator: 'CmdOrCtrl+H',
          click: (m, win) => win && win.webContents.send('menu:replace')
        },
        { type: 'separator' },
        {
          label: 'Insert Date/Time',
          accelerator: 'F5',
          click: (m, win) => win && win.webContents.send('menu:insert-datetime')
        }
      ]
    },
    {
      label: '&View',
      submenu: [
        {
          label: 'Toggle &Markdown Preview',
          accelerator: 'CmdOrCtrl+P',
          click: (m, win) => win && win.webContents.send('menu:toggle-preview')
        },
        {
          label: 'Toggle &Word Wrap',
          accelerator: 'Alt+Z',
          click: (m, win) => win && win.webContents.send('menu:toggle-wrap')
        },
        {
          label: 'Toggle &Line Numbers',
          accelerator: 'Alt+L',
          click: (m, win) => win && win.webContents.send('menu:toggle-linenumbers')
        },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
        {
          label: 'Toggle Developer Tools',
          accelerator: 'F12',
          click: (m, win) => win && win.webContents.toggleDevTools()
        }
      ]
    },
    {
      label: '&Format',
      submenu: [
        {
          label: 'Bold',
          accelerator: 'CmdOrCtrl+B',
          click: (m, win) => win && win.webContents.send('format:bold')
        },
        {
          label: 'Italic',
          accelerator: 'CmdOrCtrl+I',
          click: (m, win) => win && win.webContents.send('format:italic')
        },
        {
          label: 'Code Block',
          accelerator: 'CmdOrCtrl+K',
          click: (m, win) => win && win.webContents.send('format:code')
        },
        {
          label: 'Heading 1',
          accelerator: 'CmdOrCtrl+1',
          click: (m, win) => win && win.webContents.send('format:h1')
        },
        {
          label: 'Heading 2',
          accelerator: 'CmdOrCtrl+2',
          click: (m, win) => win && win.webContents.send('format:h2')
        },
        {
          label: 'Heading 3',
          accelerator: 'CmdOrCtrl+3',
          click: (m, win) => win && win.webContents.send('format:h3')
        },
        {
          label: 'Unordered List',
          accelerator: 'CmdOrCtrl+U',
          click: (m, win) => win && win.webContents.send('format:list')
        }
      ]
    },
    {
      label: '&Mode',
      submenu: [
        {
          label: 'New &Incognito Window (No LLM)',
          accelerator: 'CmdOrCtrl+Shift+X',
          click: (m, win) => {
            if (win) {
              win.webContents.send('menu:trigger-ultralight');
            } else {
              createNotepadWindow({ mode: 'ultralight' });
            }
          }
        },
        {
          label: 'Switch to &AI Enabled Window (Migrate Docs)',
          accelerator: 'CmdOrCtrl+Shift+Z',
          click: (m, win) => {
            if (win) {
              win.webContents.send('menu:trigger-ai-transfer');
            } else {
              createNotepadWindow({ mode: 'ai' });
            }
          }
        }
      ]
    },
    {
      label: '&Help',
      submenu: [
        {
          label: 'Keyboard Shortcuts',
          accelerator: 'F1',
          click: (m, win) => win && win.webContents.send('menu:shortcuts')
        },
        {
          label: 'About Cross Notepad',
          click: (m, win) => win && win.webContents.send('menu:about')
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);
}

// -------------------------------------------------------------
// IPC Communication Handlers
// -------------------------------------------------------------

ipcMain.handle('window:open-ultralight', (event, docs) => {
  createNotepadWindow({ mode: 'ultralight', docs: docs || [] });
  return true;
});

ipcMain.handle('window:open-ai-and-transfer', (event, docs) => {
  const callerWin = BrowserWindow.fromWebContents(event.sender);
  createNotepadWindow({ mode: 'ai', docs: docs || [] });
  if (callerWin && !callerWin.isDestroyed()) {
    callerWin.close();
  }
  return true;
});

async function readTextFileUniversal(filePath) {
  const buffer = await fs.readFile(filePath);
  
  if (buffer.length === 0) {
    return '';
  }

  // 1. UTF-8 BOM: EF BB BF
  if (buffer.length >= 3 && buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF) {
    return buffer.slice(3).toString('utf8');
  }
  // 2. UTF-16 LE BOM: FF FE
  if (buffer.length >= 2 && buffer[0] === 0xFF && buffer[1] === 0xFE) {
    return buffer.slice(2).toString('utf16le');
  }
  // 3. UTF-16 BE BOM: FE FF
  if (buffer.length >= 2 && buffer[0] === 0xFE && buffer[1] === 0xFF) {
    const swapped = Buffer.alloc(buffer.length - 2);
    for (let i = 2; i < buffer.length - 1; i += 2) {
      swapped[i - 2] = buffer[i + 1];
      swapped[i - 1] = buffer[i];
    }
    return swapped.toString('utf16le');
  }

  // 4. Universal standard UTF-8 (tolerant to any renamed text file)
  try {
    const decoder = new TextDecoder('utf-8', { fatal: false });
    return decoder.decode(buffer);
  } catch (e) {
    return buffer.toString('utf8');
  }
}

ipcMain.handle('file:open-dialog', async (event, options) => {
  const focusedWin = BrowserWindow.getFocusedWindow();
  const res = await dialog.showOpenDialog(focusedWin, {
    title: 'Open File',
    properties: ['openFile'],
    filters: [
      { name: 'All Text & Code Files (*.txt, *.md, *.fl, *.log, *.json, *.yaml, *.rtf)', extensions: ['txt', 'md', 'markdown', 'fl', 'log', 'ini', 'cfg', 'conf', 'json', 'yaml', 'yml', 'xml', 'csv', 'tsv', 'rtf', 'bat', 'sh', 'py', 'js', 'html', 'css'] },
      { name: 'FL Files (*.fl)', extensions: ['fl'] },
      { name: 'Text Files (*.txt)', extensions: ['txt'] },
      { name: 'Markdown Files (*.md)', extensions: ['md', 'markdown'] },
      { name: 'Rich Text Format (*.rtf)', extensions: ['rtf'] },
      { name: 'All Files (*.*)', extensions: ['*'] }
    ]
  });

  if (res.canceled || res.filePaths.length === 0) {
    return null;
  }

  const filePath = res.filePaths[0];
  try {
    const content = await readTextFileUniversal(filePath);
    return {
      path: filePath,
      name: path.basename(filePath),
      content: content
    };
  } catch (err) {
    throw new Error(`Failed to read file: ${err.message}`);
  }
});

ipcMain.handle('file:save-dialog', async (event, { defaultName, defaultPath, extension }) => {
  const focusedWin = BrowserWindow.getFocusedWindow();
  const ext = (extension || 'txt').toLowerCase();
  
  let filters = [
    { name: 'All Files (*.*)', extensions: ['*'] },
    { name: 'FL Files (*.fl)', extensions: ['fl'] },
    { name: 'Text Files (*.txt)', extensions: ['txt'] },
    { name: 'Markdown Files (*.md)', extensions: ['md'] },
    { name: 'Rich Text Format (*.rtf)', extensions: ['rtf'] }
  ];

  if (ext === 'fl') {
    filters = [
      { name: 'FL Files (*.fl)', extensions: ['fl'] },
      { name: 'Text Files (*.txt)', extensions: ['txt'] },
      { name: 'Markdown Files (*.md)', extensions: ['md'] },
      { name: 'Rich Text Format (*.rtf)', extensions: ['rtf'] },
      { name: 'All Files (*.*)', extensions: ['*'] }
    ];
  } else if (ext === 'rtf') {
    filters = [
      { name: 'Rich Text Format (*.rtf)', extensions: ['rtf'] },
      { name: 'Text Files (*.txt)', extensions: ['txt'] },
      { name: 'Markdown Files (*.md)', extensions: ['md'] },
      { name: 'FL Files (*.fl)', extensions: ['fl'] },
      { name: 'All Files (*.*)', extensions: ['*'] }
    ];
  } else if (ext === 'md') {
    filters = [
      { name: 'Markdown Files (*.md)', extensions: ['md'] },
      { name: 'Text Files (*.txt)', extensions: ['txt'] },
      { name: 'FL Files (*.fl)', extensions: ['fl'] },
      { name: 'Rich Text Format (*.rtf)', extensions: ['rtf'] },
      { name: 'All Files (*.*)', extensions: ['*'] }
    ];
  }

  const res = await dialog.showSaveDialog(focusedWin, {
    title: 'Save File',
    defaultPath: defaultPath || defaultName || `untitled.${ext}`,
    filters: filters
  });

  if (res.canceled || !res.filePath) {
    return null;
  }

  return res.filePath;
});

ipcMain.handle('file:write', async (event, { filePath, content }) => {
  try {
    await fs.writeFile(filePath, content, 'utf8');
    return { success: true, name: path.basename(filePath), path: filePath };
  } catch (err) {
    throw new Error(`Failed to save file: ${err.message}`);
  }
});

ipcMain.handle('file:read', async (event, filePath) => {
  try {
    const content = await readTextFileUniversal(filePath);
    return {
      path: filePath,
      name: path.basename(filePath),
      content: content
    };
  } catch (err) {
    throw new Error(`Failed to read file: ${err.message}`);
  }
});

ipcMain.handle('dialog:confirm-close', async (event, filename) => {
  const focusedWin = BrowserWindow.getFocusedWindow();
  const res = await dialog.showMessageBox(focusedWin, {
    type: 'question',
    buttons: ['Save', "Don't Save", 'Cancel'],
    defaultId: 0,
    cancelId: 2,
    title: 'Unsaved Changes',
    message: `Do you want to save changes to ${filename}?`,
    detail: "Your changes will be lost if you don't save them."
  });

  return ['save', 'dont-save', 'cancel'][res.response];
});

ipcMain.handle('app:get-platform', () => {
  return process.platform;
});

ipcMain.handle('app:get-ai-enabled', async () => {
  return await isAIEnabled();
});

ipcMain.handle('ai:ensure-service', async () => {
  await startAIService();
  return true;
});

function getSessionFilePath() {
  try {
    const userData = app.getPath('userData');
    return path.join(userData, 'session_state.json');
  } catch (e) {
    return path.join(__dirname, '..', 'config', 'session_state.json');
  }
}

ipcMain.handle('session:save', async (event, sessionData) => {
  try {
    const filePath = getSessionFilePath();
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(sessionData, null, 2), 'utf8');
    return { success: true };
  } catch (err) {
    console.warn('[Electron] Could not save session_state.json:', err.message);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('session:load', async () => {
  try {
    const filePath = getSessionFilePath();
    const raw = await fs.readFile(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    try {
      const fallbackPath = path.join(__dirname, '..', 'config', 'session_state.json');
      const raw = await fs.readFile(fallbackPath, 'utf8');
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }
});

ipcMain.handle('session:clear', async () => {
  try {
    const filePath = getSessionFilePath();
    await fs.unlink(filePath);
  } catch (e) {}
  return true;
});

ipcMain.handle('app:relaunch-no-ai', async () => {
  createNotepadWindow({ mode: 'ultralight' });
});

ipcMain.handle('app:relaunch-with-ai', async () => {
  createNotepadWindow({ mode: 'ai' });
});

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', async (event, commandLine, workingDirectory) => {
    // Focus the existing window
    const firstWin = Array.from(windows)[0];
    if (firstWin) {
      if (firstWin.isMinimized()) firstWin.restore();
      firstWin.focus();

      // Extract file path from command line
      const args = commandLine.slice(app.isPackaged ? 1 : 2);
      const filePathArg = args.find(arg => !arg.startsWith('--') && !arg.startsWith('-'));
      if (filePathArg) {
        try {
          const resolvedPath = path.isAbsolute(filePathArg)
            ? filePathArg
            : path.resolve(workingDirectory || process.cwd(), filePathArg);
          const stats = await fs.stat(resolvedPath);
          if (stats.isFile()) {
            const content = await readTextFileUniversal(resolvedPath);
            firstWin.webContents.send('file:opened-from-cli', {
              path: resolvedPath,
              name: path.basename(resolvedPath),
              content: content
            });
          }
        } catch (err) {
          console.error('[Electron] Failed to open file from second instance:', err);
        }
      }
    }
  });

  app.whenReady().then(() => {
    startAIService();
    buildMenu();
    createNotepadWindow({ mode: 'ai' });

    // System-level Global Shortcuts for guaranteed instant capture
    try {
      globalShortcut.register('CommandOrControl+Shift+X', () => {
        const focusedWin = BrowserWindow.getFocusedWindow();
        if (focusedWin) {
          focusedWin.webContents.send('menu:trigger-ultralight');
        } else {
          createNotepadWindow({ mode: 'ultralight' });
        }
      });

      globalShortcut.register('CommandOrControl+Shift+Z', () => {
        const focusedWin = BrowserWindow.getFocusedWindow();
        if (focusedWin) {
          focusedWin.webContents.send('menu:trigger-ai-transfer');
        } else {
          createNotepadWindow({ mode: 'ai' });
        }
      });
    } catch (e) {
      console.warn('[Electron] Global shortcut register error:', e.message);
    }

    app.on('activate', () => {
      if (windows.size === 0) createNotepadWindow({ mode: 'ai' });
    });
  });

  app.on('will-quit', () => {
    globalShortcut.unregisterAll();
  });

  app.on('window-all-closed', () => {
    if (aiProcess) {
      try { aiProcess.kill(); } catch (e) {}
    }
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });
}

