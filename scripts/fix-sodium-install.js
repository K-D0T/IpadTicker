/**
 * Fixes the sodium package install.js bug on Windows (msvsVersion not defined,
 * and only VS 2010–2015 allowed). Run after "npm install node-appletv" fails:
 *   node scripts/fix-sodium-install.js
 * Then run: npm install node-appletv
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const sodiumDir = path.join(__dirname, '..', 'node_modules', 'sodium');
const installPath = path.join(sodiumDir, 'install.js');

if (!fs.existsSync(installPath)) {
  console.log('sodium not found.');
  console.log('Run: npm install node-appletv --ignore-scripts');
  console.log('Then run this script again: node scripts/fix-sodium-install.js');
  process.exit(1);
}

let code = fs.readFileSync(installPath, 'utf8');

// Fix 1: msvsVersion is not defined -> use process.env.npm_config_msvs_version
code = code.replace(/msvsVersion/g, 'process.env.npm_config_msvs_version');

// Fix 2: allow VS 2019 and 2022 in the version check regex
code = code.replace(/2015\$\//, '2015|2019|2022$/' );

// Fix 3: add VS 2019, 2022, 2026 to platformTools. Use v143 for 2019 (v140/v142 often 404; v143 exists and usually links with VS 2019).
code = code.replace(
  /2015: 'v140'\s*\}/,
  "2015: 'v140',\n        2019: 'v143',\n        2022: 'v143',\n        2026: 'v143'\n    }"
);

// Fix 4: use npx node-gyp so it works without global node-gyp
code = code.replace(/'node-gyp rebuild'/g, "'npx node-gyp rebuild'");
code = code.replace(/exec\('node-gyp configure'\)/, "exec('npx node-gyp configure')");

fs.writeFileSync(installPath, code);
console.log('Patched node_modules/sodium/install.js');

const env = {
  ...process.env,
  npm_config_msvs_version: process.env.npm_config_msvs_version || '2019',
};

const projectRoot = path.join(__dirname, '..');

const msvs = env.npm_config_msvs_version || '2019';
const depsDir = path.join(sodiumDir, 'deps', 'build');
const buildDir = path.join(sodiumDir, 'build');
const libPath = path.join(sodiumDir, 'deps', 'build', 'lib', 'libsodium.lib');
const isValidLib = () => {
  if (!fs.existsSync(libPath)) return false;
  const st = fs.statSync(libPath);
  if (st.size < 50000) return false; // real .lib is much larger
  const buf = fs.readFileSync(libPath, { flag: 'r' });
  const head = buf.slice(0, 20).toString('utf8');
  return !head.startsWith('<!') && !head.startsWith('<?');
};
if (fs.existsSync(depsDir) || fs.existsSync(buildDir)) {
  if (!isValidLib()) {
    console.log('Removing corrupt or missing libs so v143 can be re-downloaded...');
    try {
      if (fs.existsSync(depsDir)) fs.rmSync(depsDir, { recursive: true });
      if (fs.existsSync(buildDir)) fs.rmSync(buildDir, { recursive: true });
    } catch (e) {
      console.warn('Could not clean:', e.message);
    }
  }
}

process.chdir(sodiumDir);
console.log('Running sodium preinstall...');
execSync('node install.js --preinstall', { stdio: 'inherit', env });
console.log('Running sodium install (node-gyp rebuild)...');
execSync('node install.js --install', { stdio: 'inherit', env });

process.chdir(projectRoot);
console.log('Building other native modules (ed25519, etc.)...');
execSync('npm rebuild ed25519 sodium', { stdio: 'inherit', env });

console.log('Done. You can run: npm run dev');
process.exit(0);
