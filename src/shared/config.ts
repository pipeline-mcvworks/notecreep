import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';

export type DockEdge = 'left' | 'right' | 'top' | 'bottom';
export type ThemeMode = 'system' | 'light' | 'dark';

export interface NoteCreepConfig {
  hotkey: string;
  dockEdge: DockEdge;
  theme: ThemeMode;
  gistToken: string;
  windowWidth: number;
  windowHeight: number;
  animationDurationMs: number;
  opacity: number;
  alwaysOnTop: boolean;
}

export const DEFAULT_CONFIG: NoteCreepConfig = {
  hotkey: process.platform === 'darwin' ? 'Command+Shift+N' : 'Ctrl+Shift+N',
  dockEdge: 'right',
  theme: 'system',
  gistToken: '',
  windowWidth: 420,
  windowHeight: 640,
  animationDurationMs: 180,
  opacity: 1.0,
  alwaysOnTop: true,
};

const CONFIG_FILENAME = 'config.json';
const VALID_DOCK_EDGES: DockEdge[] = ['left', 'right', 'top', 'bottom'];
const VALID_THEMES: ThemeMode[] = ['system', 'light', 'dark'];

function getConfigFilePath(): string {
  return path.join(app.getPath('userData'), CONFIG_FILENAME);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function stringOrDefault(value: unknown, fallback: string): string {
  return typeof value === 'string' ? value : fallback;
}

function numberOrDefault(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function booleanOrDefault(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function dockEdgeOrDefault(value: unknown, fallback: DockEdge): DockEdge {
  return typeof value === 'string' && VALID_DOCK_EDGES.includes(value as DockEdge)
    ? (value as DockEdge)
    : fallback;
}

function themeOrDefault(value: unknown, fallback: ThemeMode): ThemeMode {
  return typeof value === 'string' && VALID_THEMES.includes(value as ThemeMode)
    ? (value as ThemeMode)
    : fallback;
}

export function normalizeConfig(config: Partial<NoteCreepConfig> = {}): NoteCreepConfig {
  const source: Record<string, unknown> = isRecord(config) ? config : {};

  return {
    hotkey: stringOrDefault(source.hotkey, DEFAULT_CONFIG.hotkey),
    dockEdge: dockEdgeOrDefault(source.dockEdge, DEFAULT_CONFIG.dockEdge),
    theme: themeOrDefault(source.theme, DEFAULT_CONFIG.theme),
    gistToken: stringOrDefault(source.gistToken, DEFAULT_CONFIG.gistToken),
    windowWidth: numberOrDefault(source.windowWidth, DEFAULT_CONFIG.windowWidth),
    windowHeight: numberOrDefault(source.windowHeight, DEFAULT_CONFIG.windowHeight),
    animationDurationMs: numberOrDefault(
      source.animationDurationMs,
      DEFAULT_CONFIG.animationDurationMs,
    ),
    opacity: numberOrDefault(source.opacity, DEFAULT_CONFIG.opacity),
    alwaysOnTop: booleanOrDefault(source.alwaysOnTop, DEFAULT_CONFIG.alwaysOnTop),
  };
}

export function loadConfig(): NoteCreepConfig {
  const filePath = getConfigFilePath();
  try {
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(raw) as Partial<NoteCreepConfig>;
      return normalizeConfig(parsed);
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
    fs.writeFileSync(filePath, JSON.stringify(normalizeConfig(config), null, 2), 'utf-8');
  } catch (err) {
    console.error('[config] Failed to save:', err);
  }
}

export function updateConfig(partial: Partial<NoteCreepConfig>): NoteCreepConfig {
  const nextConfig = normalizeConfig({ ...loadConfig(), ...partial });
  saveConfig(nextConfig);
  return nextConfig;
}
