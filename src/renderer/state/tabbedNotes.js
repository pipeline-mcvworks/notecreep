import { useCallback, useEffect, useMemo, useState } from 'react';

export const DEFAULT_NOTES_STORAGE_KEY = 'tabbed-notes:v1';

const timestamp = () => new Date().toISOString();

const canUseLocalStorage = () => typeof window !== 'undefined' && window.localStorage;

const getDefaultStorage = () => {
  if (!canUseLocalStorage()) {
    return null;
  }

  return window.localStorage;
};

export const createBlankNote = (input = {}) => {
  const stamp = timestamp();

  return {
    id: input.id || `note-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: input.title || 'Untitled',
    content: input.content || '',
    createdAt: input.createdAt || stamp,
    updatedAt: input.updatedAt || stamp
  };
};

const normalizeNotes = (notes) => {
  if (!Array.isArray(notes)) {
    return [];
  }

  const seenIds = new Set();

  return notes
    .map((note) => createBlankNote(note || {}))
    .filter((note) => {
      if (seenIds.has(note.id)) {
        return false;
      }

      seenIds.add(note.id);
      return true;
    });
};

const ensureNotes = (notes) => {
  const normalized = normalizeNotes(notes);
  return normalized.length > 0 ? normalized : [createBlankNote()];
};

const resolveActiveNoteId = (notes, activeNoteId) => {
  if (notes.some((note) => note.id === activeNoteId)) {
    return activeNoteId;
  }

  return notes[0]?.id || null;
};

const nextUntitledTitle = (notes) => {
  const titles = new Set(notes.map((note) => note.title));
  let index = notes.length + 1;
  let title = `Untitled ${index}`;

  while (titles.has(title)) {
    index += 1;
    title = `Untitled ${index}`;
  }

  return title;
};

const readStoredState = (storage, storageKey, initialNotes, initialActiveNoteId) => {
  const fallbackNotes = ensureNotes(initialNotes);
  const fallbackActiveNoteId = resolveActiveNoteId(fallbackNotes, initialActiveNoteId);

  if (!storage) {
    return {
      notes: fallbackNotes,
      activeNoteId: fallbackActiveNoteId
    };
  }

  try {
    const rawValue = storage.getItem(storageKey);

    if (!rawValue) {
      return {
        notes: fallbackNotes,
        activeNoteId: fallbackActiveNoteId
      };
    }

    const parsed = JSON.parse(rawValue);
    const storedNotes = ensureNotes(Array.isArray(parsed) ? parsed : parsed.notes);
    const storedActiveNoteId = Array.isArray(parsed) ? null : parsed.activeNoteId;

    return {
      notes: storedNotes,
      activeNoteId: resolveActiveNoteId(storedNotes, storedActiveNoteId)
    };
  } catch (error) {
    return {
      notes: fallbackNotes,
      activeNoteId: fallbackActiveNoteId
    };
  }
};

export const reorderNotes = (notes, sourceId, targetId) => {
  if (sourceId === targetId) {
    return notes;
  }

  const sourceIndex = notes.findIndex((note) => note.id === sourceId);
  const targetIndex = notes.findIndex((note) => note.id === targetId);

  if (sourceIndex === -1 || targetIndex === -1) {
    return notes;
  }

  const nextNotes = [...notes];
  const [movedNote] = nextNotes.splice(sourceIndex, 1);
  nextNotes.splice(targetIndex, 0, movedNote);

  return nextNotes;
};

export const getCycledNoteId = (notes, activeNoteId, direction = 1) => {
  if (notes.length === 0) {
    return null;
  }

  const activeIndex = Math.max(0, notes.findIndex((note) => note.id === activeNoteId));
  const nextIndex = (activeIndex + direction + notes.length) % notes.length;

  return notes[nextIndex].id;
};

export const useTabbedNotes = ({
  storageKey = DEFAULT_NOTES_STORAGE_KEY,
  initialNotes = [],
  initialActiveNoteId = null,
  persist = true,
  storage = getDefaultStorage(),
  onNotesChange,
  onActiveNoteChange
} = {}) => {
  const [state, setState] = useState(() => readStoredState(persist ? storage : null, storageKey, initialNotes, initialActiveNoteId));

  const activeNote = useMemo(
    () => state.notes.find((note) => note.id === state.activeNoteId) || state.notes[0] || null,
    [state.activeNoteId, state.notes]
  );

  useEffect(() => {
    if (!persist || !storage) {
      return;
    }

    storage.setItem(storageKey, JSON.stringify({
      version: 1,
      notes: state.notes,
      activeNoteId: state.activeNoteId
    }));
  }, [persist, state.activeNoteId, state.notes, storage, storageKey]);

  useEffect(() => {
    onNotesChange?.(state.notes);
  }, [onNotesChange, state.notes]);

  useEffect(() => {
    onActiveNoteChange?.(activeNote);
  }, [activeNote, onActiveNoteChange]);

  const selectNote = useCallback((noteId) => {
    setState((current) => {
      if (!current.notes.some((note) => note.id === noteId)) {
        return current;
      }

      return {
        ...current,
        activeNoteId: noteId
      };
    });
  }, []);

  const createNote = useCallback((input = {}) => {
    setState((current) => {
      const note = createBlankNote({
        title: input.title || nextUntitledTitle(current.notes),
        content: input.content || ''
      });

      return {
        notes: [...current.notes, note],
        activeNoteId: note.id
      };
    });
  }, []);

  const closeNote = useCallback((noteId) => {
    setState((current) => {
      const idToClose = noteId || current.activeNoteId;
      const closedIndex = current.notes.findIndex((note) => note.id === idToClose);

      if (closedIndex === -1) {
        return current;
      }

      const remainingNotes = current.notes.filter((note) => note.id !== idToClose);

      if (remainingNotes.length === 0) {
        const replacementNote = createBlankNote();

        return {
          notes: [replacementNote],
          activeNoteId: replacementNote.id
        };
      }

      const nextActiveNoteId = current.activeNoteId === idToClose
        ? remainingNotes[Math.min(closedIndex, remainingNotes.length - 1)].id
        : current.activeNoteId;

      return {
        notes: remainingNotes,
        activeNoteId: nextActiveNoteId
      };
    });
  }, []);

  const renameNote = useCallback((noteId, title) => {
    const trimmedTitle = title.trim() || 'Untitled';

    setState((current) => ({
      ...current,
      notes: current.notes.map((note) => note.id === noteId
        ? { ...note, title: trimmedTitle, updatedAt: timestamp() }
        : note)
    }));
  }, []);

  const updateNoteContent = useCallback((noteId, content) => {
    setState((current) => ({
      ...current,
      notes: current.notes.map((note) => note.id === noteId
        ? { ...note, content, updatedAt: timestamp() }
        : note)
    }));
  }, []);

  const reorderNote = useCallback((sourceId, targetId) => {
    setState((current) => ({
      ...current,
      notes: reorderNotes(current.notes, sourceId, targetId)
    }));
  }, []);

  const cycleNote = useCallback((direction = 1) => {
    setState((current) => ({
      ...current,
      activeNoteId: getCycledNoteId(current.notes, current.activeNoteId, direction)
    }));
  }, []);

  return {
    notes: state.notes,
    activeNoteId: state.activeNoteId,
    activeNote,
    selectNote,
    createNote,
    closeNote,
    renameNote,
    updateNoteContent,
    reorderNote,
    cycleNote
  };
};
