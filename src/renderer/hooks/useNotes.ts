import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Note } from '../../shared/types';

interface NoteCreepBridge {
  notes: {
    list: () => Promise<{ ok: boolean; data?: Note[]; error?: string }>;
    create: (input?: { title?: string; body?: string }) => Promise<{ ok: boolean; data?: Note; error?: string }>;
    update: (input: { id: string; title?: string; body?: string }) => Promise<{ ok: boolean; data?: Note | null; error?: string }>;
    delete: (id: string) => Promise<{ ok: boolean; data?: { deleted: boolean }; error?: string }>;
    reorder: (input: { orderedIds: string[] }) => Promise<{ ok: boolean; data?: Note[]; error?: string }>;
  };
}

declare global {
  interface Window {
    notecreep?: NoteCreepBridge;
  }
}

export interface TabNote {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

const noteToTabNote = (n: Note): TabNote => ({
  id: n.id,
  title: n.title,
  content: n.body,
  createdAt: n.createdAt,
  updatedAt: n.updatedAt,
});

const stubNotes = (): TabNote[] => [{
  id: 'stub-1',
  title: 'Welcome',
  content: '<p>Start writing…</p>',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}];

export function useNotes() {
  const bridge = typeof window !== 'undefined' ? window.notecreep : undefined;
  const [notes, setNotes] = useState<TabNote[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!bridge) {
        if (!cancelled) {
          const fallback = stubNotes();
          setNotes(fallback);
          setActiveNoteId(fallback[0].id);
          setLoaded(true);
        }
        return;
      }
      const res = await bridge.notes.list();
      if (cancelled) return;
      const list = (res.ok && res.data) ? res.data.map(noteToTabNote) : [];
      if (list.length === 0) {
        const created = await bridge.notes.create({ title: 'Untitled', body: '<p>Start writing…</p>' });
        const seeded = created.ok && created.data ? [noteToTabNote(created.data)] : [];
        if (!cancelled) {
          setNotes(seeded);
          setActiveNoteId(seeded[0]?.id ?? null);
          setLoaded(true);
        }
        return;
      }
      setNotes(list);
      setActiveNoteId(list[0].id);
      setLoaded(true);
    })();
    return () => { cancelled = true; };
  }, [bridge]);

  const refresh = useCallback(async () => {
    if (!bridge) return;
    const res = await bridge.notes.list();
    if (res.ok && res.data) setNotes(res.data.map(noteToTabNote));
  }, [bridge]);

  const activeNote = useMemo(
    () => notes.find((n) => n.id === activeNoteId) ?? notes[0] ?? null,
    [notes, activeNoteId]
  );

  const selectNote = useCallback((id: string) => setActiveNoteId(id), []);

  const createNote = useCallback(async () => {
    if (!bridge) return;
    const res = await bridge.notes.create({ title: 'Untitled', body: '<p></p>' });
    if (res.ok && res.data) {
      const t = noteToTabNote(res.data);
      setNotes((prev) => [...prev, t]);
      setActiveNoteId(t.id);
    }
  }, [bridge]);

  const closeNote = useCallback(async (id: string | null) => {
    if (!bridge || !id) return;
    const res = await bridge.notes.delete(id);
    if (res.ok) {
      setNotes((prev) => {
        const next = prev.filter((n) => n.id !== id);
        if (activeNoteId === id) {
          setActiveNoteId(next[0]?.id ?? null);
        }
        return next;
      });
    }
  }, [bridge, activeNoteId]);

  const renameNote = useCallback(async (id: string, title: string) => {
    if (!bridge) return;
    const res = await bridge.notes.update({ id, title });
    if (res.ok && res.data) {
      const t = noteToTabNote(res.data);
      setNotes((prev) => prev.map((n) => (n.id === id ? t : n)));
    }
  }, [bridge]);

  const updateNoteContent = useCallback(async (id: string, content: string) => {
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, content } : n)));
    if (!bridge) return;
    await bridge.notes.update({ id, body: content });
  }, [bridge]);

  const reorderNote = useCallback(async (sourceId: string, targetId: string) => {
    if (sourceId === targetId) return;
    setNotes((prev) => {
      const sIdx = prev.findIndex((n) => n.id === sourceId);
      const tIdx = prev.findIndex((n) => n.id === targetId);
      if (sIdx < 0 || tIdx < 0) return prev;
      const next = [...prev];
      const [moved] = next.splice(sIdx, 1);
      next.splice(tIdx, 0, moved);
      bridge?.notes.reorder({ orderedIds: next.map((n) => n.id) });
      return next;
    });
  }, [bridge]);

  const cycleNote = useCallback((direction: number) => {
    setNotes((prev) => {
      if (prev.length === 0) return prev;
      const idx = Math.max(0, prev.findIndex((n) => n.id === activeNoteId));
      const nextIdx = (idx + direction + prev.length) % prev.length;
      setActiveNoteId(prev[nextIdx].id);
      return prev;
    });
  }, [activeNoteId]);

  return {
    notes,
    activeNoteId,
    activeNote,
    loaded,
    selectNote,
    createNote,
    closeNote,
    renameNote,
    updateNoteContent,
    reorderNote,
    cycleNote,
    refresh,
  };
}
