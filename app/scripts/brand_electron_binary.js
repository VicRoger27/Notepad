const fs = require('fs');
const path = require('path');
const { rcedit } = require('rcedit');

async function brandBinary() {
  const rootDir = path.resolve(__dirname, '..', '..');
  const appDir = path.join(rootDir, 'app');
  const electronDist = path.join(appDir, 'node_modules', 'electron', 'dist');
  const sourceExe = path.join(electronDist, 'electron.exe');
  const targetExe = path.join(electronDist, 'CrossNotepad.exe');
  const iconPath = path.join(rootDir, 'Windows', 'icon.ico');

  if (!fs.existsSync(sourceExe)) {
    console.error('Source electron.exe not found at:', sourceExe);
    return;
  }

  console.log('Copying electron.exe -> CrossNotepad.exe...');
  fs.copyFileSync(sourceExe, targetExe);

  console.log('Applying PE version resources and icons using rcedit...');
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

  console.log('✓ Successfully branded CrossNotepad.exe with icon and metadata!');
}

brandBinary().catch(err => {
  console.error('Error branding binary:', err);
  process.exit(1);
});
