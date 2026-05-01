import React, { useCallback } from 'react';
import EdgeDockShell from './components/EdgeDockShell';
import { TabStrip } from './components/Tabs/Tabs';
import Editor from './components/Editor/Editor';
import { ShareButton } from './components/Share/ShareButton';
import { useNotes, TabNote } from './hooks/useNotes';
import './styles/theme.css';
import './styles/tabs.css';
import './styles/editor.css';

export default function App(): JSX.Element {
  const {
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
  } = useNotes();

  const renderEditor = useCallback(
    (note: TabNote | null) => {
      if (!note) {
        return <div className="tabs-editor-shell" style={{ opacity: 0.6 }}>No note selected.</div>;
      }
      return (
        <div className="tabs-editor-shell">
          <Editor
            key={note.id}
            noteId={note.id}
            initialContent={note.content || '<p></p>'}
            onSave={(_id: string, html: string) => updateNoteContent(note.id, html)}
          />
        </div>
      );
    },
    [updateNoteContent]
  );

  const shareNote = activeNote
    ? { id: activeNote.id, title: activeNote.title, content: activeNote.content, html: activeNote.content }
    : null;

  return (
    <EdgeDockShell
      title="NoteCreep"
      subtitle={loaded ? `${notes.length} note${notes.length === 1 ? '' : 's'}` : 'Loading…'}
      actions={<ShareButton note={shareNote} />}
    >
      <TabStrip
        notes={notes}
        activeNoteId={activeNoteId}
        activeNote={activeNote}
        selectNote={selectNote}
        createNote={createNote}
        closeNote={closeNote}
        renameNote={renameNote}
        updateNoteContent={updateNoteContent}
        reorderNote={reorderNote}
        cycleNote={cycleNote}
        renderEditor={renderEditor}
      />
    </EdgeDockShell>
  );
}
