// MasterTV Samsung Smart TV Tizen Package Generator (.wgt)
// Packages the compiled production web application into a Samsung Tizen Widget
// Strictly ASCII comments only as per project guidelines

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { generateAuthorSignature } from './sign-tizen.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('[TIZEN BUILD] Starting Samsung Smart TV package generation...');

// Step 1: Ensure dist directory exists or build it
const distDir = path.join(rootDir, 'dist');
if (!fs.existsSync(distDir) || !fs.existsSync(path.join(distDir, 'index.html'))) {
  console.log('[TIZEN BUILD] Running npm run build first...');
  execSync('npm run build', { stdio: 'inherit', cwd: rootDir });
}

// Step 2: Prepare tizen-build staging directory
const stagingDir = path.join(rootDir, 'tizen-build');
if (fs.existsSync(stagingDir)) {
  fs.rmSync(stagingDir, { recursive: true, force: true });
}
fs.mkdirSync(stagingDir, { recursive: true });

// Helper to copy directory recursively
function copyDirSync(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

console.log('[TIZEN BUILD] Copying production assets from dist...');
copyDirSync(distDir, stagingDir);

// Step 3: Copy Tizen specific manifest and icons
const tizenSrcDir = path.join(rootDir, 'tizen');
const configXmlPath = path.join(tizenSrcDir, 'config.xml');
const iconPngPath = path.join(tizenSrcDir, 'icon.png');

if (fs.existsSync(configXmlPath)) {
  fs.copyFileSync(configXmlPath, path.join(stagingDir, 'config.xml'));
  console.log('[TIZEN BUILD] Included config.xml manifest.');
} else {
  console.error('[TIZEN BUILD] Error: tizen/config.xml not found!');
  process.exit(1);
}

if (fs.existsSync(iconPngPath)) {
  fs.copyFileSync(iconPngPath, path.join(stagingDir, 'icon.png'));
  console.log('[TIZEN BUILD] Included icon.png.');
}

// Step 3.5: Clean up any old .wgt or .zip inside staging directory and sign package
const stagingWgt = path.join(stagingDir, 'MasterTV.wgt');
if (fs.existsSync(stagingWgt)) {
  fs.unlinkSync(stagingWgt);
}
console.log('[TIZEN BUILD] Generating digital author signature (author-signature.xml)...');
generateAuthorSignature(stagingDir);

// Step 4: Compress staging directory into MasterTV.wgt (ZIP format)
const zipTempPath = path.join(rootDir, 'MasterTV.zip');
const wgtOutputPath = path.join(rootDir, 'MasterTV.wgt');

if (fs.existsSync(zipTempPath)) {
  fs.unlinkSync(zipTempPath);
}
if (fs.existsSync(wgtOutputPath)) {
  fs.unlinkSync(wgtOutputPath);
}

console.log('[TIZEN BUILD] Creating MasterTV.wgt archive...');
const psCommand = `powershell -NoProfile -Command "Compress-Archive -Path '${stagingDir}\\*' -DestinationPath '${zipTempPath}' -Force"`;
execSync(psCommand, { stdio: 'inherit', cwd: rootDir });

// Rename/copy MasterTV.zip to MasterTV.wgt
fs.copyFileSync(zipTempPath, wgtOutputPath);
fs.unlinkSync(zipTempPath);

// Step 5: Create userwidget directory for USB pendrive plug-and-play installation
const userwidgetDir = path.join(rootDir, 'userwidget');
fs.mkdirSync(userwidgetDir, { recursive: true });
fs.copyFileSync(wgtOutputPath, path.join(userwidgetDir, 'MasterTV.wgt'));

// Step 6: Sync to local XAMPP web server and dist if present
try {
  const xamppDir = 'C:\\xampp\\htdocs\\mastertv';
  if (fs.existsSync(xamppDir)) {
    fs.copyFileSync(wgtOutputPath, path.join(xamppDir, 'MasterTV.wgt'));
  }
  if (fs.existsSync(distDir)) {
    fs.copyFileSync(wgtOutputPath, path.join(distDir, 'MasterTV.wgt'));
  }
} catch {
  // Optional sync
}

console.log('');
console.log('========================================================');
console.log(' SAMSUNG SMART TV (TIZEN) BUILD SUCCESSFUL!');
console.log(' Output package: ' + wgtOutputPath);
console.log(' USB installation folder: ' + path.join(userwidgetDir, 'MasterTV.wgt'));
console.log(' Web download: https://mastertvhd.online/MasterTV.wgt');
console.log('========================================================');
