import fs from 'fs';
import path from 'path';
import { app } from 'electron';
import { EdgeConfig, DEFAULT_CONFIG } from '../shared/config';

const CONFIG_FILENAME = 'edge-dock-config.json';

function getConfigPath(): string {
  return path.join(app.getPath('userData'), CONFIG_FILENAME);
}

export function loadConfig(): EdgeConfig {
  const configPath = getConfigPath();
  try {
    if (fs.existsSync(configPath)) {
      const raw = fs.readFileSync(configPath, 'utf-8');
      const parsed = JSON.parse(raw) as Partial<EdgeConfig>;
      return { ...DEFAULT_CONFIG, ...parsed };
    }
  } catch (err) {
    console.warn('[configStore] Failed to load config, using defaults:', err);
  }
  return { ...DEFAULT_CONFIG };
}

export function saveConfig(config: EdgeConfig): void {
  const configPath = getConfigPath();
  try {
    fs.mkdirSync(path.dirname(configPath), { recursive: true });
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
  } catch (err) {
    console.error('[configStore] Failed to save config:', err);
  }
}
