import React from 'react';

export default function EditorToolbar({ editor }) {
  if (!editor) {
    return null;
  }

  return (
    <div className="editor-toolbar">
      <button
        className={`editor-toolbar-button ${editor.isActive('bold') ? 'active' : ''}`}
        onClick={() => editor.chain().focus().toggleBold().run()}
        title="Bold (Ctrl+B)"
      >
        <strong>B</strong>
      </button>
      <button
        className={`editor-toolbar-button ${editor.isActive('italic') ? 'active' : ''}`}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        title="Italic (Ctrl+I)"
      >
        <em>I</em>
      </button>
      <button
        className={`editor-toolbar-button ${editor.isActive('underline') ? 'active' : ''}`}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        title="Underline (Ctrl+U)"
      >
        <u>U</u>
      </button>
      <span className="editor-toolbar-separator" />
      <button
        className={`editor-toolbar-button ${editor.isActive('heading', { level: 1 }) ? 'active' : ''}`}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        title="Heading 1"
      >
        H1
      </button>
      <button
        className={`editor-toolbar-button ${editor.isActive('heading', { level: 2 }) ? 'active' : ''}`}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        title="Heading 2"
      >
        H2
      </button>
      <button
        className={`editor-toolbar-button ${editor.isActive('heading', { level: 3 }) ? 'active' : ''}`}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        title="Heading 3"
      >
        H3
      </button>
      <span className="editor-toolbar-separator" />
      <button
        className={`editor-toolbar-button ${editor.isActive('bulletList') ? 'active' : ''}`}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        title="Bullet List"
      >
        •
      </button>
      <button
        className={`editor-toolbar-button ${editor.isActive('orderedList') ? 'active' : ''}`}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        title="Numbered List"
      >
        1.
      </button>
      <span className="editor-toolbar-separator" />
      <button
        className={`editor-toolbar-button ${editor.isActive('code') ? 'active' : ''}`}
        onClick={() => editor.chain().focus().toggleCode().run()}
        title="Inline Code"
      >
        {'</>'}
      </button>
    </div>
  );
}
