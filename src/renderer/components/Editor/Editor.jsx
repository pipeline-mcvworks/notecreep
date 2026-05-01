import React, { useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import EditorToolbar from './EditorToolbar';
import useAutosave from '../../hooks/useAutosave';
import '../../styles/editor.css';

export default function Editor({ noteId, initialContent, onSave }) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
    ],
    content: initialContent || '<p>Start writing...</p>',
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      autosave(html);
    },
  });

  const saveToStorage = useCallback(
    (content) => {
      if (onSave) {
        onSave(noteId, content);
      }
    },
    [noteId, onSave]
  );

  const autosave = useAutosave(saveToStorage, 1000);

  if (!editor) {
    return null;
  }

  return (
    <div className="editor-container">
      <EditorToolbar editor={editor} />
      <EditorContent editor={editor} className="editor-content" />
    </div>
  );
}
