/**
 * src/main/tray.ts
 *
 * Creates and manages the system tray icon.
 * Single-click toggles window visibility; the context menu has a Quit item.
 */

import { Tray, Menu, app, nativeImage } from 'electron';
import * as path from 'path';

export type ToggleFn = () => void;

export class TrayManager {
  private tray: Tray | null = null;

  /**
   * Initialise the tray icon.
   * @param onToggle  Called when the user clicks the tray icon.
   */
  create(onToggle: ToggleFn): void {
    const iconPath = path.join(__dirname, '..', '..', 'assets', 'tray', 'icon.png');
    let icon = nativeImage.createFromPath(iconPath);

    // Provide a template image on macOS for proper dark/light mode support.
    if (process.platform === 'darwin') {
      icon = icon.resize({ width: 16, height: 16 });
      icon.setTemplateImage(true);
    } else {
      icon = icon.resize({ width: 16, height: 16 });
    }

    this.tray = new Tray(icon);
    this.tray.setToolTip('NoteCreep');

    // Build a minimal context menu (right-click on all platforms, only menu on Linux).
    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Toggle NoteCreep',
        click: onToggle,
      },
      { type: 'separator' },
      {
        label: 'Quit',
        click: () => {
          app.quit();
        },
      },
    ]);

    this.tray.setContextMenu(contextMenu);

    // Single-click toggles on Windows/Linux; on macOS single-click shows context menu
    // by default, so we override with a click handler.
    this.tray.on('click', onToggle);
  }

  destroy(): void {
    if (this.tray) {
      this.tray.destroy();
      this.tray = null;
    }
  }
}
