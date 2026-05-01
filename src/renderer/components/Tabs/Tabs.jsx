import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTabbedNotes } from '../../state/tabbedNotes';
import '../../styles/tabs.css';

const SHORTCUTS = [
  ['Ctrl+T', 'Create a new note'],
  ['Ctrl+W', 'Close the active note'],
  ['F2', 'Rename the active note'],
  ['Ctrl+Tab', 'Switch to the next note'],
  ['Ctrl+Shift+Tab', 'Switch to the previous note']
];

const isShortcutModifier = (event) => event.ctrlKey || event.metaKey;

export const TabStrip = ({
  notes = [],
  activeNoteId,
  activeNote,
  selectNote,
  createNote,
  closeNote,
  renameNote,
  updateNoteContent,
  reorderNote,
  cycleNote,
  renderEditor,
  className = '',
  ariaLabel = 'Notes'
}) => {
  const [helpOpen, setHelpOpen] = useState(false);
  const [renamingId, setRenamingId] = useState(null);
  const [draftTitle, setDraftTitle] = useState('');
  const [draggingId, setDraggingId] = useState(null);
  const [dragOverId, setDragOverId] = useState(null);

  const resolvedActiveNote = useMemo(
    () => activeNote || notes.find((note) => note.id === activeNoteId) || notes[0] || null,
    [activeNote, activeNoteId, notes]
  );

  const beginRename = useCallback((note = resolvedActiveNote) => {
    if (!note) {
      return;
    }

    setRenamingId(note.id);
    setDraftTitle(note.title);
  }, [resolvedActiveNote]);

  const finishRename = useCallback(() => {
    if (!renamingId) {
      return;
    }

    renameNote?.(renamingId, draftTitle);
    setRenamingId(null);
    setDraftTitle('');
  }, [draftTitle, renameNote, renamingId]);

  const cancelRename = useCallback(() => {
    setRenamingId(null);
    setDraftTitle('');
  }, []);

  useEffect(() => {
    const handleKeyDown = (event) => {
      const key = event.key.toLowerCase();
      const modifier = isShortcutModifier(event);

      if (modifier && key === 't') {
        event.preventDefault();
        createNote?.();
        return;
      }

      if (modifier && key === 'w') {
        event.preventDefault();
        closeNote?.(activeNoteId);
        return;
      }

      if (modifier && key === 'tab') {
        event.preventDefault();
        cycleNote?.(event.shiftKey ? -1 : 1);
        return;
      }

      if (!modifier && key === 'f2') {
        event.preventDefault();
        beginRename();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeNoteId, beginRename, closeNote, createNote, cycleNote]);

  const handleDragStart = (event, noteId) => {
    setDraggingId(noteId);
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', noteId);
  };

  const handleDrop = (event, noteId) => {
    event.preventDefault();
    const sourceId = draggingId || event.dataTransfer.getData('text/plain');

    if (sourceId && sourceId !== noteId) {
      reorderNote?.(sourceId, noteId);
    }

    setDraggingId(null);
    setDragOverId(null);
  };

  const editor = typeof renderEditor === 'function'
    ? renderEditor(resolvedActiveNote, { notes, activeNoteId, updateNoteContent })
    : renderEditor === false
      ? null
      : (
        <div className='tabs-editor-shell'>
          <textarea
            className='tabs-editor'
            value={resolvedActiveNote?.content || ''}
            onChange={(event) => resolvedActiveNote && updateNoteContent?.(resolvedActiveNote.id, event.target.value)}
            placeholder='Start writing your note...'
            aria-label='Active note editor'
          />
        </div>
      );

  return (
    <section className={`tabs-root ${className}`.trim()}>
      <div className='tabs-bar' role='tablist' aria-label={ariaLabel}>
        <div className='tabs-list'>
          {notes.map((note) => {
            const active = note.id === activeNoteId;
            const renaming = note.id === renamingId;
            const dragging = note.id === draggingId;
            const dragOver = note.id === dragOverId;

            return (
              <div
                key={note.id}
                className={`tabs-tab ${active ? 'is-active' : ''} ${dragging ? 'is-dragging' : ''} ${dragOver ? 'is-drag-over' : ''}`.trim()}
                draggable={!renaming}
                role='presentation'
                onDragStart={(event) => handleDragStart(event, note.id)}
                onDragEnd={() => {
                  setDraggingId(null);
                  setDragOverId(null);
                }}
                onDragOver={(event) => {
                  event.preventDefault();
                  setDragOverId(note.id);
                }}
                onDragLeave={() => setDragOverId(null)}
                onDrop={(event) => handleDrop(event, note.id)}
              >
                {renaming ? (
                  <input
                    className='tabs-rename-input'
                    value={draftTitle}
                    autoFocus
                    onFocus={(event) => event.target.select()}
                    onChange={(event) => setDraftTitle(event.target.value)}
                    onBlur={finishRename}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        finishRename();
                      }

                      if (event.key === 'Escape') {
                        event.preventDefault();
                        cancelRename();
                      }
                    }}
                    aria-label='Rename note'
                  />
                ) : (
                  <button
                    className='tabs-tab-button'
                    type='button'
                    role='tab'
                    aria-selected={active}
                    tabIndex={active ? 0 : -1}
                    onClick={() => selectNote?.(note.id)}
                    onDoubleClick={() => beginRename(note)}
                    title='Double click or press F2 to rename'
                  >
                    <span className='tabs-tab-title'>{note.title}</span>
                  </button>
                )}
                <button
                  className='tabs-close-button'
                  type='button'
                  aria-label={`Close ${note.title}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    closeNote?.(note.id);
                  }}
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>
        <button className='tabs-action-button' type='button' onClick={() => createNote?.()} aria-label='Create note'>+</button>
        <button className='tabs-help-button' type='button' onClick={() => setHelpOpen(true)} aria-label='Show tab shortcuts'>?</button>
      </div>

      {editor}

      {helpOpen && (
        <div className='tabs-help-backdrop' role='presentation' onClick={() => setHelpOpen(false)}>
          <div className='tabs-help-dialog' role='dialog' aria-modal='true' aria-labelledby='tabs-help-title' onClick={(event) => event.stopPropagation()}>
            <div className='tabs-help-header'>
              <h2 id='tabs-help-title'>Note tab shortcuts</h2>
              <button className='tabs-help-close' type='button' onClick={() => setHelpOpen(false)} aria-label='Close shortcuts help'>×</button>
            </div>
            <dl className='tabs-shortcut-list'>
              {SHORTCUTS.map(([shortcut, description]) => (
                <div className='tabs-shortcut-row' key={shortcut}>
                  <dt><kbd>{shortcut}</kbd></dt>
                  <dd>{description}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      )}
    </section>
  );
};

export const Tabs = ({
  storageKey,
  initialNotes,
  initialActiveNoteId,
  persist,
  storage,
  onNotesChange,
  onActiveNoteChange,
  ...tabProps
}) => {
  const store = useTabbedNotes({
    storageKey,
    initialNotes,
    initialActiveNoteId,
    persist,
    storage,
    onNotesChange,
    onActiveNoteChange
  });

  return <TabStrip {...tabProps} {...store} />;
};

export default Tabs;
