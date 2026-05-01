import { contextBridge, ipcRenderer } from 'electron';
import type { NoteCreepConfig } from '../shared/config';
import type {
  Note,
  NoteCreateInput,
  NoteUpdateInput,
  ReorderInput,
  IpcResult,
} from '../shared/types';
import {
  SHARE_EMAIL_CHANNEL,
  SHARE_CLOUD_SYNC_CHANNEL,
  SHARE_SET_GIST_TOKEN_CHANNEL,
  SHARE_HAS_GIST_TOKEN_CHANNEL,
  SHARE_CLEAR_GIST_TOKEN_CHANNEL,
} from './share/ipc';
import type { ShareNote, CloudSyncResult } from './share/types';

const notes = {
  list: (): Promise<IpcResult<Note[]>> => ipcRenderer.invoke('note:list'),
  get: (id: string): Promise<IpcResult<Note | null>> => ipcRenderer.invoke('note:get', id),
  create: (input: NoteCreateInput = {}): Promise<IpcResult<Note>> => ipcRenderer.invoke('note:create', input),
  update: (input: NoteUpdateInput): Promise<IpcResult<Note | null>> => ipcRenderer.invoke('note:update', input),
  delete: (id: string): Promise<IpcResult<{ deleted: boolean }>> => ipcRenderer.invoke('note:delete', id),
  reorder: (input: ReorderInput): Promise<IpcResult<Note[]>> => ipcRenderer.invoke('note:reorder', input),
};

const config = {
  get: (): Promise<NoteCreepConfig> => ipcRenderer.invoke('config:get'),
  set: (next: NoteCreepConfig): Promise<NoteCreepConfig> => ipcRenderer.invoke('config:set', next),
};

const share = {
  email: (note: ShareNote): Promise<void> => ipcRenderer.invoke(SHARE_EMAIL_CHANNEL, note),
  cloudSync: (note: ShareNote): Promise<CloudSyncResult> => ipcRenderer.invoke(SHARE_CLOUD_SYNC_CHANNEL, note),
  setGistToken: (token: string): Promise<void> => ipcRenderer.invoke(SHARE_SET_GIST_TOKEN_CHANNEL, token),
  hasGistToken: (): Promise<boolean> => ipcRenderer.invoke(SHARE_HAS_GIST_TOKEN_CHANNEL),
  clearGistToken: (): Promise<void> => ipcRenderer.invoke(SHARE_CLEAR_GIST_TOKEN_CHANNEL),
};

contextBridge.exposeInMainWorld('notecreep', { notes, config, share });
contextBridge.exposeInMainWorld('shareApi', share);

export type NoteCreepBridge = {
  notes: typeof notes;
  config: typeof config;
  share: typeof share;
};
