#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const os = require('os');
const cp = require('child_process');

function die(msg) { console.error(msg); process.exit(1); }

const target = process.argv[2];
if (!target) die('Usage: node scripts/package-platform.js <target>  (e.g. linux-x64, win32-x64, darwin-x64, darwin-arm64)');

const platformMap = {
  'win32-x64': 'win32',
  'linux-x64': 'linux',
  'darwin-x64': 'darwin',
  'darwin-arm64': 'darwin'
};

const sdkName = platformMap[target];
if (!sdkName) die('Unknown target: ' + target);

const repoRoot = path.resolve(__dirname, '..');
const pkg = require(path.join(repoRoot, 'package.json'));
const version = pkg.version || '0.0.0';
const tmpBase = fs.mkdtempSync(path.join(os.tmpdir(), 'vscode-atari-st-dev-'));
const workDir = path.join(tmpBase, 'work');
fs.mkdirSync(workDir);

console.log('Creating packaging workspace at', workDir);

// Copy repo to temporary workspace, but filter SDK folders to only include the target platform
function shouldCopy(absPath) {
  const rel = path.relative(repoRoot, absPath).split(path.sep).join('/');
  if (!rel || rel === '') return true;
  // skip Git and local test metadata; keep node_modules so the temporary build
  // workspace can still run `npm run compile` during `vsce` prepublish.
  if (rel.startsWith('.git')) return false;
  if (rel.startsWith('.vscode-test')) return false;
  if (rel.startsWith('out/test')) return false;

  // Handle sdk: only copy sdk/<sdkName> and the sdk root itself
  if (rel === 'sdk') return true;
  if (rel.startsWith('sdk/')) {
    const parts = rel.split('/');
    if (parts[1] !== sdkName) return false;
  }

  return true;
}

function copyRecursive(src, dest) {
  if (!shouldCopy(src)) return;
  const stat = fs.lstatSync(src);

  // Preserve symbolic links by recreating the link at destination (do not follow)
  if (stat.isSymbolicLink()) {
    const linkTarget = fs.readlinkSync(src);
    const parent = path.dirname(dest);
    if (!fs.existsSync(parent)) fs.mkdirSync(parent, { recursive: true });
    try {
      const type = process.platform === 'win32' ? 'junction' : undefined;
      fs.symlinkSync(linkTarget, dest, type);
    } catch (e) {
      // fallback: copy the linked file contents if symlink creation fails
      try {
        const resolved = fs.realpathSync(src);
        const resolvedStat = fs.statSync(resolved);
        if (resolvedStat.isDirectory()) {
          if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
          for (const f of fs.readdirSync(resolved)) {
            copyRecursive(path.join(resolved, f), path.join(dest, f));
          }
        } else {
          fs.copyFileSync(resolved, dest);
          try { fs.chmodSync(dest, resolvedStat.mode); } catch (er) {}
        }
      } catch (er2) {
        // give up silently; this file won't be included
      }
    }
    return;
  }

  if (stat.isDirectory()) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest);
    try { fs.chmodSync(dest, stat.mode); } catch (e) {}
    for (const f of fs.readdirSync(src)) {
      copyRecursive(path.join(src, f), path.join(dest, f));
    }
    return;
  }

  if (stat.isFile()) {
    const parent = path.dirname(dest);
    if (!fs.existsSync(parent)) fs.mkdirSync(parent, { recursive: true });
    fs.copyFileSync(src, dest);
    try { fs.chmodSync(dest, stat.mode); } catch (e) {}
  }
}

copyRecursive(repoRoot, workDir);

// Run vsce package inside the temp workDir
console.log('Running vsce package for target', target);
const opts = { cwd: workDir, stdio: 'inherit', shell: true };
const res = cp.spawnSync('npx', ['-y', '@vscode/vsce', 'package', '--target', target, '--allow-star-activation'], opts);
if (res.error || res.status !== 0) {
  console.error('vsce packaging failed');
  process.exit(res.status || 1);
}

// Move resulting VSIX to repository root and name it with the target
const vsixFiles = fs.readdirSync(workDir).filter(n => n.endsWith('.vsix'));
if (vsixFiles.length === 0) {
  die('No .vsix produced in ' + workDir);
}
const vsix = vsixFiles[0];
const srcVsix = path.join(workDir, vsix);
const destVsix = path.join(repoRoot, `atari-st-dev-${version}-${target}.vsix`);
fs.copyFileSync(srcVsix, destVsix);
console.log('Produced', destVsix);

// Clean up temporary workspace
try { fs.rmSync(tmpBase, { recursive: true, force: true }); } catch (e) {}

process.exit(0);
