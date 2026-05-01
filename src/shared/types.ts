/**
 * Shared types used by both main and renderer processes.
 * Import from this module rather than duplicating definitions.
 */

/** A single note as stored on disk and returned over IPC. */
export interface Note {
  /** UUID v4 string */
  id: string;
  /** Display title of the note */
  title: string;
  /**
   * Rich-text body serialised as a JSON string.
   * Consumers (e.g. TipTap / ProseMirror) should JSON.parse this value.
   */
  body: string;
  /** ISO-8601 timestamp – set on creation, never changed */
  createdAt: string;
  /** ISO-8601 timestamp – updated on every write */
  updatedAt: string;
  /**
   * Integer used for manual ordering in the tab/sidebar list.
   * Lower values appear first. Gaps are allowed.
   */
  order: number;
}

/** Payload accepted by the note:create IPC channel. */
export interface NoteCreateInput {
  title?: string;
  /** Rich-text JSON string; defaults to empty ProseMirror doc if omitted */
  body?: string;
}

/** Payload accepted by the note:update IPC channel. */
export interface NoteUpdateInput {
  id: string;
  title?: string;
  /** Rich-text JSON string */
  body?: string;
}

/** Payload accepted by the note:reorder IPC channel. */
export interface ReorderInput {
  /** Ordered array of note IDs representing the desired sequence */
  orderedIds: string[];
}

/** Generic IPC response envelope. */
export interface IpcResult<T = unknown> {
  ok: boolean;
  data?: T;
  error?: string;
}
