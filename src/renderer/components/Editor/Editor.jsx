import React, { useCallback, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Extension from '@tiptap/core';
import EditorToolbar from './EditorToolbar';
import useAutosave from '../../hooks/useAutosave';
import '../../styles/editor.css';

const keymapExtension = Extension.create({
  name: 'keymap',
  addKeyboardShortcuts() {
    return {
      'Ctrl-Shift-7': () => this.editor.chain().focus().toggleBulletList().run(),
      'Ctrl-Shift-8': () => this.editor.chain().focus().toggleOrderedList().run(),
    };
  },
});

export default function Editor({ noteId, initialContent, onSave }) {
  const saveToStorage = useCallback(
    (content) => {
      if (onSave) {
        onSave(noteId, content);
      }
    },
    [noteId, onSave]
  );

  const autosave = useAutosave(saveToStorage, 1000);
  const autosaveRef = useRef(autosave);
  autosaveRef.current = autosave;

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
      keymapExtension,
    ],
    content: initialContent || '<p>Start writing...</p>',
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      autosaveRef.current(html);
    },
  });

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
