import { ipcMain, IpcMainInvokeEvent } from 'electron';
import type { NoteStore } from '../storage/NoteStore';
import type {
  NoteCreateInput,
  NoteUpdateInput,
  ReorderInput,
  IpcResult,
} from '../../shared/types';

/**
 * Register all note-related IPC handlers against the supplied NoteStore.
 *
 * Call this once from the main process after `app.whenReady()`, e.g.:
 *
 *   import { registerNoteHandlers } from './ipc';
 *   import { NoteStore } from './storage';
 *
 *   const store = new NoteStore(path.join(app.getPath('userData'), 'notes.db'));
 *   registerNoteHandlers(store);
 *
 * Renderer usage (via contextBridge / preload):
 *
 *   const notes = await window.electron.invoke('note:list');
 */
export function registerNoteHandlers(store: NoteStore): void {
  /**
   * note:create
   * Payload : NoteCreateInput  (optional title, optional body)
   * Returns : IpcResult<Note>
   */
  ipcMain.handle(
    'note:create',
    (_event: IpcMainInvokeEvent, input: NoteCreateInput = {}): IpcResult => {
      try {
        const note = store.create(input);
        return { ok: true, data: note };
      } catch (err) {
        return { ok: false, error: String(err) };
      }
    }
  );

  /**
   * note:get
   * Payload : string  (note id)
   * Returns : IpcResult<Note | null>
   */
  ipcMain.handle(
    'note:get',
    (_event: IpcMainInvokeEvent, id: string): IpcResult => {
      try {
        const note = store.getById(id);
        return { ok: true, data: note };
      } catch (err) {
        return { ok: false, error: String(err) };
      }
    }
  );

  /**
   * note:list
   * Payload : (none)
   * Returns : IpcResult<Note[]>
   */
  ipcMain.handle(
    'note:list',
    (_event: IpcMainInvokeEvent): IpcResult => {
      try {
        const notes = store.list();
        return { ok: true, data: notes };
      } catch (err) {
        return { ok: false, error: String(err) };
      }
    }
  );

  /**
   * note:update
   * Payload : NoteUpdateInput  ({ id, title?, body? })
   * Returns : IpcResult<Note | null>
   */
  ipcMain.handle(
    'note:update',
    (_event: IpcMainInvokeEvent, input: NoteUpdateInput): IpcResult => {
      try {
        if (!input?.id) {
          return { ok: false, error: 'note:update requires an id field' };
        }
        const note = store.update(input);
        return { ok: true, data: note };
      } catch (err) {
        return { ok: false, error: String(err) };
      }
    }
  );

  /**
   * note:delete
   * Payload : string  (note id)
   * Returns : IpcResult<{ deleted: boolean }>
   */
  ipcMain.handle(
    'note:delete',
    (_event: IpcMainInvokeEvent, id: string): IpcResult => {
      try {
        if (!id) {
          return { ok: false, error: 'note:delete requires an id' };
        }
        const deleted = store.delete(id);
        return { ok: true, data: { deleted } };
      } catch (err) {
        return { ok: false, error: String(err) };
      }
    }
  );

  /**
   * note:reorder
   * Payload : ReorderInput  ({ orderedIds: string[] })
   * Returns : IpcResult<Note[]>  – full updated list in new order
   */
  ipcMain.handle(
    'note:reorder',
    (_event: IpcMainInvokeEvent, input: ReorderInput): IpcResult => {
      try {
        if (!Array.isArray(input?.orderedIds)) {
          return { ok: false, error: 'note:reorder requires orderedIds array' };
        }
        const notes = store.reorder(input);
        return { ok: true, data: notes };
      } catch (err) {
        return { ok: false, error: String(err) };
      }
    }
  );
}
