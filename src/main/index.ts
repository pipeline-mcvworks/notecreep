import { app, ipcMain } from 'electron';
import * as path from 'path';
import { loadConfig, saveConfig, NoteCreepConfig } from '../shared/config';
import { WindowManager } from './windowManager';
import { TrayManager } from './tray';
import { HotkeyManager } from './hotkey';
import { NoteStore } from './storage';
import { registerNoteHandlers } from './ipc';
import { registerShareIpcHandlers } from './share';

let windowManager: WindowManager;
let trayManager: TrayManager;
let hotkeyManager: HotkeyManager;
let noteStore: NoteStore;
let unregisterShare: (() => void) | null = null;

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    windowManager?.show();
  });

  app.whenReady().then(() => {
    const config = loadConfig();

    windowManager = new WindowManager(config);
    windowManager.createWindow();
    if (process.env.NODE_ENV === 'development') {
      windowManager.show();
    }

    trayManager = new TrayManager();
    trayManager.create(() => windowManager.toggle());

    hotkeyManager = new HotkeyManager();
    hotkeyManager.register(config.hotkey, () => windowManager.toggle());

    const dbPath = path.join(app.getPath('userData'), 'notes.db');
    noteStore = new NoteStore(dbPath);
    registerNoteHandlers(noteStore);

    unregisterShare = registerShareIpcHandlers();

    ipcMain.handle('config:get', (): NoteCreepConfig => loadConfig());
    ipcMain.handle('config:set', (_e, next: NoteCreepConfig) => {
      saveConfig(next);
      windowManager.applyConfig(next);
      hotkeyManager.register(next.hotkey, () => windowManager.toggle());
      return next;
    });

    app.on('window-all-closed', (event: Event) => {
      event.preventDefault();
    });

    app.on('activate', () => {
      windowManager.show();
    });
  });

  app.on('will-quit', () => {
    hotkeyManager?.unregisterAll();
    trayManager?.destroy();
    unregisterShare?.();
    noteStore?.close();
  });
}
