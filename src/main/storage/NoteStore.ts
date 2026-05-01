import Database from 'better-sqlite3';
import { randomUUID } from 'crypto';
import path from 'path';
import fs from 'fs';
import type { Note, NoteCreateInput, NoteUpdateInput, ReorderInput } from '../../shared/types';

/** Default empty ProseMirror / TipTap document. */
const EMPTY_DOC = JSON.stringify({ type: 'doc', content: [] });

/**
 * NoteStore wraps a better-sqlite3 database and exposes synchronous CRUD
 * operations for notes.  All public methods are safe to call from the
 * main process (they are synchronous and never touch the renderer).
 */
export class NoteStore {
  private db: Database.Database;

  /**
   * @param dbPath Absolute path to the SQLite file.
   *               The directory must already exist (use app.getPath('userData')).
   */
  constructor(dbPath: string) {
    // Ensure parent directory exists
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');
    this.migrate();
  }

  // ---------------------------------------------------------------------------
  // Schema
  // ---------------------------------------------------------------------------

  private migrate(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS notes (
        id         TEXT    PRIMARY KEY,
        title      TEXT    NOT NULL DEFAULT '',
        body       TEXT    NOT NULL DEFAULT '${EMPTY_DOC}',
        created_at TEXT    NOT NULL,
        updated_at TEXT    NOT NULL,
        ord        INTEGER NOT NULL DEFAULT 0
      );

      CREATE INDEX IF NOT EXISTS idx_notes_ord ON notes (ord);
    `);
  }

  // ---------------------------------------------------------------------------
  // CRUD
  // ---------------------------------------------------------------------------

  /** Create a new note and return it. */
  create(input: NoteCreateInput = {}): Note {
    const now = new Date().toISOString();
    const id = randomUUID();
    const title = input.title ?? 'Untitled';
    const body = input.body ?? EMPTY_DOC;

    // Place new note at the end
    const maxOrdRow = this.db
      .prepare<[], { max_ord: number | null }>('SELECT MAX(ord) AS max_ord FROM notes')
      .get();
    const ord = (maxOrdRow?.max_ord ?? -1) + 1;

    this.db
      .prepare(
        `INSERT INTO notes (id, title, body, created_at, updated_at, ord)
         VALUES (@id, @title, @body, @createdAt, @updatedAt, @ord)`
      )
      .run({ id, title, body, createdAt: now, updatedAt: now, ord });

    return this.getById(id) as Note;
  }

  /** Return a single note by id, or null if not found. */
  getById(id: string): Note | null {
    const row = this.db
      .prepare<[string], RawRow>('SELECT * FROM notes WHERE id = ?')
      .get(id);
    return row ? rowToNote(row) : null;
  }

  /** Return all notes ordered by ord ASC, then created_at ASC. */
  list(): Note[] {
    const rows = this.db
      .prepare<[], RawRow>('SELECT * FROM notes ORDER BY ord ASC, created_at ASC')
      .all();
    return rows.map(rowToNote);
  }

  /**
   * Update title and/or body of an existing note.
   * Returns the updated note, or null if the id was not found.
   */
  update(input: NoteUpdateInput): Note | null {
    const existing = this.getById(input.id);
    if (!existing) return null;

    const now = new Date().toISOString();
    const title = input.title ?? existing.title;
    const body = input.body ?? existing.body;

    this.db
      .prepare(
        `UPDATE notes SET title = @title, body = @body, updated_at = @updatedAt
         WHERE id = @id`
      )
      .run({ title, body, updatedAt: now, id: input.id });

    return this.getById(input.id);
  }

  /**
   * Delete a note by id.
   * Returns true if a row was deleted, false if the id was not found.
   */
  delete(id: string): boolean {
    const result = this.db
      .prepare('DELETE FROM notes WHERE id = ?')
      .run(id);
    return result.changes > 0;
  }

  /**
   * Reorder notes according to the supplied ordered array of IDs.
   * IDs not present in the array are left at the end in their existing order.
   * This operation runs inside a transaction.
   */
  reorder(input: ReorderInput): Note[] {
    const { orderedIds } = input;

    const reorderTx = this.db.transaction((ids: string[]) => {
      const stmt = this.db.prepare('UPDATE notes SET ord = @ord WHERE id = @id');
      ids.forEach((id, index) => {
        stmt.run({ ord: index, id });
      });

      // Push any notes not mentioned in orderedIds to the end
      const placeholders = ids.map(() => '?').join(', ');
      if (ids.length > 0) {
        const unmentioned = this.db
          .prepare<string[], RawRow>(
            `SELECT * FROM notes WHERE id NOT IN (${placeholders})
             ORDER BY ord ASC, created_at ASC`
          )
          .all(...ids);

        unmentioned.forEach((row, i) => {
          stmt.run({ ord: ids.length + i, id: row.id });
        });
      }
    });

    reorderTx(orderedIds);
    return this.list();
  }

  /** Close the underlying database connection (useful in tests / shutdown). */
  close(): void {
    this.db.close();
  }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

interface RawRow {
  id: string;
  title: string;
  body: string;
  created_at: string;
  updated_at: string;
  ord: number;
}

function rowToNote(row: RawRow): Note {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    order: row.ord,
  };
}
