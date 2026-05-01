/**
 * src/main/index.ts
 *
 * Electron main process entry point for NoteCreep.
 * Wires together: config, BrowserWindow, tray icon, and global hotkey.
 */

import { app, BrowserWindow } from 'electron';
import { loadConfig } from '../shared/config';
import { WindowManager } from './windowManager';
import { TrayManager } from './tray';
import { HotkeyManager } from './hotkey';

// Keep a module-level reference so GC doesn't collect these.
let windowManager: WindowManager;
let trayManager: TrayManager;
let hotkeyManager: HotkeyManager;

// Prevent multiple instances of the app.
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  // If a second instance is launched, show the existing window.
  app.on('second-instance', () => {
    windowManager?.show();
  });

  app.whenReady().then(() => {
    const config = loadConfig();

    // --- Window ---
    windowManager = new WindowManager(config);
    windowManager.createWindow();

    // --- Tray ---
    trayManager = new TrayManager();
    trayManager.create(() => windowManager.toggle());

    // --- Hotkey ---
    hotkeyManager = new HotkeyManager();
    hotkeyManager.register(config.hotkey, () => windowManager.toggle());

    // macOS: do not quit when all windows are closed (we live in the tray).
    app.on('window-all-closed', (event: Event) => {
      event.preventDefault();
    });

    app.on('activate', () => {
      // macOS dock click — show the window.
      windowManager.show();
    });
  });

  app.on('will-quit', () => {
    hotkeyManager?.unregisterAll();
    trayManager?.destroy();
  });
}
