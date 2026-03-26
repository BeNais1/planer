const { app, BrowserWindow, ipcMain } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const fs = require('fs');

// ── Data persistence ─────────────────────────────────────────
const DATA_FILE = path.join(app.getPath('userData'), 'planer-data.json');

function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    }
  } catch (e) {
    console.error('Failed to load data:', e);
  }
  return { pages: [], tasks: [] };
}

function saveData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.error('Failed to save data:', e);
  }
}

// ── Window creation ──────────────────────────────────────────
let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 500,
    height: 400,
    minWidth: 400,
    minHeight: 300,
    frame: false,
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#F5F5F7',
      symbolColor: '#1D1D1F',
      height: 40,
    },
    backgroundColor: '#FFFFFF',
    resizable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    show: false,
  });

  // Smooth show after ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Handle load errors — retry
  mainWindow.webContents.on('did-fail-load', (_event, _code, _desc, url) => {
    console.log(`Failed to load ${url}, retrying in 1s...`);
    setTimeout(() => {
      mainWindow.loadURL(url);
    }, 1000);
  });

  // Allow popups (required for Firebase Google Sign-In)
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    return { action: 'allow' };
  });

  // Dev or production URL
  const isDev = !app.isPackaged;
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    // Open DevTools for debugging
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    // Serve production app via HTTP so Firebase Auth popups (Google Sign-in) work
    const http = require('http');
    
    const server = http.createServer((req, res) => {
      // Clean query params
      let reqPath = req.url.split('?')[0];
      if (reqPath === '/') reqPath = '/index.html';
      
      let filePath = path.join(__dirname, '..', 'dist', reqPath);
      
      // Fallback for SPA routing if file doesn't exist
      if (!fs.existsSync(filePath)) {
        filePath = path.join(__dirname, '..', 'dist', 'index.html');
      }
      
      const extname = String(path.extname(filePath)).toLowerCase();
      const mimeTypes = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml'
      };
      
      const contentType = mimeTypes[extname] || 'application/octet-stream';
      
      fs.readFile(filePath, (err, content) => {
        if (err) {
          res.writeHead(500);
          res.end(`Sorry, check with the site admin for error: ${err.code} ..\n`);
          res.end();
        } else {
          res.writeHead(200, { 'Content-Type': contentType });
          res.end(content, 'utf-8');
        }
      });
    });

    // Use a fixed port to keep the origin stable for Firebase (e.g. http://localhost:49215)
    server.on('error', (e) => {
      if (e.code === 'EADDRINUSE') {
        server.listen(0, 'localhost'); // Fallback to random if busy
      }
    });

    server.listen(49215, 'localhost', () => {
      const port = server.address().port;
      mainWindow.loadURL(`http://localhost:${port}`);
    });
  }
}

// ── IPC Handlers ─────────────────────────────────────────────
ipcMain.handle('data:load', () => loadData());
ipcMain.handle('data:save', (_event, data) => {
  saveData(data);
  return true;
});
ipcMain.handle('window:minimize', () => mainWindow?.minimize());
ipcMain.handle('window:maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow?.maximize();
  }
});
ipcMain.handle('window:close', () => mainWindow?.close());
ipcMain.handle('splash:done', () => {
  if (!mainWindow) return;
  const { width: screenW, height: screenH } = require('electron').screen.getPrimaryDisplay().workAreaSize;
  const targetW = 1100;
  const targetH = 720;
  const x = Math.round((screenW - targetW) / 2);
  const y = Math.round((screenH - targetH) / 2);
  mainWindow.setMinimumSize(900, 600);
  mainWindow.setResizable(true);
  mainWindow.setBounds({ x, y, width: targetW, height: targetH }, true);
});
ipcMain.handle('theme:update', (_event, theme) => {
  if (!mainWindow) return;
  mainWindow.setTitleBarOverlay({
    color: theme === 'dark' ? '#2C2C2E' : '#F5F5F7',
    symbolColor: theme === 'dark' ? '#F5F5F7' : '#1D1D1F',
    height: 40,
  });
});

// ── App lifecycle ────────────────────────────────────────────
app.whenReady().then(() => {
  createWindow();

  // Checking for updates (will run silently in the background)
  autoUpdater.checkForUpdatesAndNotify();

  // Instant feedback when an update IS found
  autoUpdater.on('update-available', (info) => {
    const { dialog } = require('electron');
    dialog.showMessageBox({
      type: 'info',
      title: 'Знайдено оновлення',
      message: `Нова версія (${info.version}) знайдена на сервері!`,
      detail: 'Оновлення зараз завантажується у фоновому режимі. Зачекайте хвилинку...'
    });
  });

  // Capture any errors (e.g., if GitHub is blocking us or repo is private)
  autoUpdater.on('error', (err) => {
    const { dialog } = require('electron');
    dialog.showErrorBox('Помилка перевірки оновлень', err == null ? "Невідома помилка" : err.toString());
  });

  // Show dialog when update is completely downloaded
  autoUpdater.on('update-downloaded', () => {
    const dialogOpts = {
      type: 'info',
      buttons: ['Встановити зараз', 'Нагадати пізніше'],
      title: 'Оновлення Planer',
      message: 'Нова версія програми успішно завантажена!',
      detail: 'Ви можете закрити програму та встановити її прямо зараз, або зробити це пізніше під час наступного запуску.'
    };

    const { dialog } = require('electron');
    dialog.showMessageBox(dialogOpts).then((returnValue) => {
      if (returnValue.response === 0) {
        autoUpdater.quitAndInstall();
      }
    });
  });
});
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
