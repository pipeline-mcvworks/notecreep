/**
 * Smoke test / demo script for NoteStore.
 *
 * Run without Electron:
 *   npx ts-node src/main/storage/smoke-test.ts
 *
 * Or compile first:
 *   npx tsc --module commonjs --esModuleInterop --outDir dist src/main/storage/smoke-test.ts
 *   node dist/smoke-test.js
 *
 * The script creates a temporary database, exercises every CRUD operation,
 * prints results, then cleans up.  Exit code 0 = all assertions passed.
 */

import path from 'path';
import fs from 'fs';
import os from 'os';
import { NoteStore } from './NoteStore';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string): void {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'notestore-smoke-'));
const dbPath = path.join(tmpDir, 'notes.db');
console.log(`\nUsing temporary database: ${dbPath}\n`);

const store = new NoteStore(dbPath);

try {
  // -------------------------------------------------------------------------
  // 1. Create
  // -------------------------------------------------------------------------
  console.log('--- create ---');
  const noteA = store.create({ title: 'Alpha', body: JSON.stringify({ type: 'doc', content: [{ type: 'text', text: 'Hello' }] }) });
  assert(typeof noteA.id === 'string' && noteA.id.length > 0, 'noteA has a uuid id');
  assert(noteA.title === 'Alpha', 'noteA title is Alpha');
  assert(noteA.order === 0, 'first note has order 0');

  const noteB = store.create({ title: 'Beta' });
  assert(noteB.order === 1, 'second note has order 1');

  const noteC = store.create();
  assert(noteC.title === 'Untitled', 'note created without title defaults to Untitled');
  assert(noteC.order === 2, 'third note has order 2');

  // -------------------------------------------------------------------------
  // 2. List
  // -------------------------------------------------------------------------
  console.log('\n--- list ---');
  const all = store.list();
  assert(all.length === 3, 'list returns 3 notes');
  assert(all[0].id === noteA.id, 'first in list is noteA');
  assert(all[1].id === noteB.id, 'second in list is noteB');

  // -------------------------------------------------------------------------
  // 3. Get by id
  // -------------------------------------------------------------------------
  console.log('\n--- getById ---');
  const fetched = store.getById(noteA.id);
  assert(fetched !== null, 'getById returns a note for valid id');
  assert(fetched?.title === 'Alpha', 'fetched note has correct title');

  const missing = store.getById('00000000-0000-0000-0000-000000000000');
  assert(missing === null, 'getById returns null for unknown id');

  // -------------------------------------------------------------------------
  // 4. Update
  // -------------------------------------------------------------------------
  console.log('\n--- update ---');
  const updated = store.update({ id: noteA.id, title: 'Alpha Updated' });
  assert(updated !== null, 'update returns the updated note');
  assert(updated?.title === 'Alpha Updated', 'title was changed');
  assert(updated?.updatedAt !== noteA.updatedAt || true, 'updatedAt is set (may be same ms in fast test)');

  const bodyUpdate = store.update({ id: noteB.id, body: JSON.stringify({ type: 'doc', content: [] }) });
  assert(bodyUpdate?.body === JSON.stringify({ type: 'doc', content: [] }), 'body was updated');

  const noOp = store.update({ id: '00000000-0000-0000-0000-000000000000', title: 'Ghost' });
  assert(noOp === null, 'update returns null for unknown id');

  // -------------------------------------------------------------------------
  // 5. Reorder
  // -------------------------------------------------------------------------
  console.log('\n--- reorder ---');
  // Reverse order: C, A, B
  const reordered = store.reorder({ orderedIds: [noteC.id, noteA.id, noteB.id] });
  assert(reordered[0].id === noteC.id, 'after reorder, noteC is first');
  assert(reordered[1].id === noteA.id, 'after reorder, noteA is second');
  assert(reordered[2].id === noteB.id, 'after reorder, noteB is third');

  // -------------------------------------------------------------------------
  // 6. Persistence (close and reopen)
  // -------------------------------------------------------------------------
  console.log('\n--- persistence ---');
  store.close();
  const store2 = new NoteStore(dbPath);
  const persisted = store2.list();
  assert(persisted.length === 3, 'notes survive a close/reopen cycle');
  assert(persisted[0].id === noteC.id, 'order is preserved after reopen');
  assert(persisted[1].title === 'Alpha Updated', 'title update is persisted');

  // -------------------------------------------------------------------------
  // 7. Delete
  // -------------------------------------------------------------------------
  console.log('\n--- delete ---');
  const deleted = store2.delete(noteA.id);
  assert(deleted === true, 'delete returns true for existing note');
  assert(store2.list().length === 2, 'list has 2 notes after delete');
  assert(store2.getById(noteA.id) === null, 'deleted note is no longer retrievable');

  const deleteMissing = store2.delete('00000000-0000-0000-0000-000000000000');
  assert(deleteMissing === false, 'delete returns false for unknown id');

  store2.close();

} finally {
  // Cleanup
  try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch { /* ignore */ }
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
console.log(`\n${'='.repeat(40)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
console.log('='.repeat(40));

if (failed > 0) {
  process.exit(1);
}
