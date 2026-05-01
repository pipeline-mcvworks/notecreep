import { contextBridge, ipcRenderer } from 'electron';
import { EdgeConfig } from '../shared/config';

/**
 * Expose a safe, typed API to the renderer process via contextBridge.
 * The renderer accesses this as `window.edgeConfig`.
 */
contextBridge.exposeInMainWorld('edgeConfig', {
  /** Retrieve the current configuration from the main process */
  getConfig: (): Promise<EdgeConfig> => ipcRenderer.invoke('config:get'),

  /** Persist a new configuration and reposition the window */
  setConfig: (config: EdgeConfig): Promise<void> =>
    ipcRenderer.invoke('config:set', config),
});

// Type augmentation so TypeScript knows about window.edgeConfig in the renderer
export {};
