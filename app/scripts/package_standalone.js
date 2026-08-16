const fs = require('fs');
const path = require('path');
const { rcedit } = require('rcedit');

function copyDirRecursive(src, dest, excludeNames = []) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    if (excludeNames.includes(entry.name)) continue;
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath, excludeNames);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

async function buildStandalone() {
  console.log('[Standalone Packager] Building self-contained native application...');

  const rootDir = path.resolve(__dirname, '..', '..');
  const appDir = path.join(rootDir, 'app');
  const electronDist = path.join(appDir, 'node_modules', 'electron', 'dist');
  const resourcesDir = path.join(electronDist, 'resources');
  const targetAppDir = path.join(resourcesDir, 'app');
  const iconPath = path.join(rootDir, 'Windows', 'icon.ico');
  const targetExe = path.join(electronDist, 'CrossNotepad.exe');
  const sourceExe = path.join(electronDist, 'electron.exe');

  // 1. Create CrossNotepad.exe
  if (fs.existsSync(sourceExe)) {
    fs.copyFileSync(sourceExe, targetExe);
  }

  // 2. Brand executable
  console.log('[Standalone Packager] Embedding high-res icons and metadata into CrossNotepad.exe...');
  await rcedit(targetExe, {
    icon: iconPath,
    'version-string': {
      ProductName: 'Cross Notepad',
      FileDescription: 'Cross Notepad',
      CompanyName: 'Vopple',
      LegalCopyright: 'Copyright © 2026 Vopple',
      OriginalFilename: 'CrossNotepad.exe',
      InternalName: 'CrossNotepad'
    },
    'file-version': '1.0.0',
    'product-version': '1.0.0'
  });

  // 3. Package app code into resources/app
  console.log('[Standalone Packager] Packaging app source code into resources/app...');
  if (!fs.existsSync(targetAppDir)) {
    fs.mkdirSync(targetAppDir, { recursive: true });
  }

  // Copy root app files
  const rootFiles = ['package.json', 'main.js', 'preload.js', 'ai_service.py', 'notepad.py'];
  for (const f of rootFiles) {
    const src = path.join(appDir, f);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, path.join(targetAppDir, f));
    }
  }

  // Copy src folder
  copyDirRecursive(path.join(appDir, 'src'), path.join(targetAppDir, 'src'));

  // Copy production node_modules (highlight.js, marked)
  const prodModules = ['highlight.js', 'marked'];
  const targetModules = path.join(targetAppDir, 'node_modules');
  if (!fs.existsSync(targetModules)) {
    fs.mkdirSync(targetModules, { recursive: true });
  }
  for (const mod of prodModules) {
    const modSrc = path.join(appDir, 'node_modules', mod);
    if (fs.existsSync(modSrc)) {
      copyDirRecursive(modSrc, path.join(targetModules, mod));
    }
  }

  // Remove default_app.asar so it runs resources/app directly
  const defaultAppAsar = path.join(resourcesDir, 'default_app.asar');
  if (fs.existsSync(defaultAppAsar)) {
    try {
      fs.unlinkSync(defaultAppAsar);
    } catch (e) {
      // Ignored if in use
    }
  }

  console.log('✓ Successfully created 100% self-contained CrossNotepad.exe application bundle!');
}

buildStandalone().catch(err => {
  console.error('Packaging failed:', err);
  process.exit(1);
});
