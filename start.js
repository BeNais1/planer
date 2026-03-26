const { spawn, execFile } = require('child_process');
const http = require('http');
const path = require('path');

// Get the electron binary path directly
const electronPath = require('electron');

// Start Vite
const vite = spawn('npx', ['vite'], {
  cwd: __dirname,
  shell: true,
  stdio: 'inherit',
});

// Poll until Vite is ready, then launch Electron
function waitForVite(retries = 30) {
  const req = http.get('http://localhost:5173', (res) => {
    console.log('\n[launcher] Vite is ready, starting Electron...\n');

    const electron = execFile(electronPath, ['.'], {
      cwd: __dirname,
      stdio: 'inherit',
    });

    electron.on('close', (code) => {
      console.log('[launcher] Electron closed.');
      vite.kill();
      process.exit(0);
    });
  });

  req.on('error', () => {
    if (retries <= 0) {
      console.error('[launcher] Vite did not start in time.');
      vite.kill();
      process.exit(1);
    }
    setTimeout(() => waitForVite(retries - 1), 1000);
  });
}

setTimeout(() => waitForVite(), 2000);

process.on('SIGINT', () => {
  vite.kill();
  process.exit(0);
});
