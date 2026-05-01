import path from 'path';
import { app, BrowserWindow, ipcMain, screen } from 'electron';
import { loadConfig, saveConfig } from './configStore';
import { applyConfig, computeBounds } from './windowManager';
import { EdgeConfig } from '../shared/config';

const isDev = process.env.NODE_ENV === 'development';

let mainWindow: BrowserWindow | null = null;
let currentConfig: EdgeConfig;

function createWindow(): void {
  currentConfig = loadConfig();
  const bounds = computeBounds(currentConfig);

  mainWindow = new BrowserWindow({
    ...bounds,
    frame: false,
    transparent: false,
    alwaysOnTop: currentConfig.alwaysOnTop,
    skipTaskbar: false,
    resizable: false,
    movable: false,
    opacity: currentConfig.opacity,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  // Set always-on-top level so it appears above most windows
  mainWindow.setAlwaysOnTop(currentConfig.alwaysOnTop, 'screen-saver');

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(
      path.join(__dirname, '../renderer/index.html')
    );
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Re-dock when display configuration changes
  screen.on('display-metrics-changed', () => {
    if (mainWindow) {
      applyConfig(mainWindow, currentConfig);
    }
  });
}

// IPC: get current config
ipcMain.handle('config:get', (): EdgeConfig => {
  return currentConfig;
});

// IPC: update config, persist, and reposition window
ipcMain.handle('config:set', (_event, newConfig: EdgeConfig): void => {
  currentConfig = { ...currentConfig, ...newConfig };
  saveConfig(currentConfig);
  if (mainWindow) {
    applyConfig(mainWindow, currentConfig);
  }
});

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
