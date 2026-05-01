/**
 * src/shared/config.ts
 *
 * Single source of truth for NoteCreep configuration.
 * Values are read at startup; changing the file requires a restart
 * for hotkey changes to take effect (live-reload is out of scope for T-002).
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export type DockEdge = 'top' | 'bottom' | 'left' | 'right';

export interface NoteCreepConfig {
  /** Global shortcut accelerator string (Electron format). */
  hotkey: string;
  /** Which screen edge the window is docked to. */
  dockEdge: DockEdge;
  /** Window width in pixels. */
  windowWidth: number;
  /** Window height in pixels. */
  windowHeight: number;
  /** Slide animation duration in milliseconds. */
  animationDurationMs: number;
}

const DEFAULTS: NoteCreepConfig = {
  hotkey: process.platform === 'darwin' ? 'Command+Shift+N' : 'Ctrl+Shift+N',
  dockEdge: 'right',
  windowWidth: 400,
  windowHeight: 600,
  animationDurationMs: 180,
};

/** Path to the user-editable JSON config file. */
export function getConfigFilePath(): string {
  return path.join(os.homedir(), '.notecreep', 'config.json');
}

/**
 * Load config from disk, merging with defaults.
 * Missing keys fall back to defaults; unknown keys are ignored.
 */
export function loadConfig(): NoteCreepConfig {
  const filePath = getConfigFilePath();
  try {
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(raw) as Partial<NoteCreepConfig>;
      return { ...DEFAULTS, ...parsed };
    }
  } catch (err) {
    console.warn('[config] Failed to load config, using defaults:', err);
  }
  return { ...DEFAULTS };
}

/**
 * Persist the current config to disk.
 * Creates the directory if it does not exist.
 */
export function saveConfig(config: NoteCreepConfig): void {
  const filePath = getConfigFilePath();
  const dir = path.dirname(filePath);
  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(config, null, 2), 'utf-8');
  } catch (err) {
    console.error('[config] Failed to save config:', err);
  }
}
