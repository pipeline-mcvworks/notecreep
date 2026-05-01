import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';

export type DockEdge = 'left' | 'right' | 'top' | 'bottom';

export interface NoteCreepConfig {
  hotkey: string;
  dockEdge: DockEdge;
  windowWidth: number;
  windowHeight: number;
  animationDurationMs: number;
  opacity: number;
  alwaysOnTop: boolean;
}

export const DEFAULT_CONFIG: NoteCreepConfig = {
  hotkey: process.platform === 'darwin' ? 'Command+Shift+N' : 'Ctrl+Shift+N',
  dockEdge: 'right',
  windowWidth: 420,
  windowHeight: 640,
  animationDurationMs: 180,
  opacity: 1.0,
  alwaysOnTop: true,
};

const CONFIG_FILENAME = 'config.json';

function getConfigFilePath(): string {
  return path.join(app.getPath('userData'), CONFIG_FILENAME);
}

export function loadConfig(): NoteCreepConfig {
  const filePath = getConfigFilePath();
  try {
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(raw) as Partial<NoteCreepConfig>;
      return { ...DEFAULT_CONFIG, ...parsed };
    }
  } catch (err) {
    console.warn('[config] Failed to load, using defaults:', err);
  }
  return { ...DEFAULT_CONFIG };
}

export function saveConfig(config: NoteCreepConfig): void {
  const filePath = getConfigFilePath();
  try {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(config, null, 2), 'utf-8');
  } catch (err) {
    console.error('[config] Failed to save:', err);
  }
}
