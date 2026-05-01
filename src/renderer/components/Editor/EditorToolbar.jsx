import React from 'react';

export default function EditorToolbar({ editor }) {
  if (!editor) {
    return null;
  }

  const ToolbarButton = ({ onClick, isActive, label, title, children }) => (
    <button
      type="button"
      onClick={onClick}
      className={`editor-toolbar-button ${isActive ? 'active' : ''}`}
      title={title}
      aria-label={label}
    >
      {children}
    </button>
  );

  return (
    <div className="editor-toolbar">
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive('bold')}
        label="Bold"
        title="Bold (Ctrl+B)"
      >
        <strong>B</strong>
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive('italic')}
        label="Italic"
        title="Italic (Ctrl+I)"
      >
        <em>I</em>
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        isActive={editor.isActive('underline')}
        label="Underline"
        title="Underline (Ctrl+U)"
      >
        <u>U</u>
      </ToolbarButton>

      <span className="editor-toolbar-separator" />

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        isActive={editor.isActive('heading', { level: 1 })}
        label="Heading 1"
        title="Heading 1"
      >
        H1
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        isActive={editor.isActive('heading', { level: 2 })}
        label="Heading 2"
        title="Heading 2"
      >
        H2
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        isActive={editor.isActive('heading', { level: 3 })}
        label="Heading 3"
        title="Heading 3"
      >
        H3
      </ToolbarButton>

      <span className="editor-toolbar-separator" />

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={editor.isActive('bulletList')}
        label="Bullet List"
        title="Bullet List"
      >
        •
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={editor.isActive('orderedList')}
        label="Numbered List"
        title="Numbered List"
      >
        1.
      </ToolbarButton>

      <span className="editor-toolbar-separator" />

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleCode().run()}
        isActive={editor.isActive('code')}
        label="Inline Code"
        title="Inline Code"
      >
        {'</>'}
      </ToolbarButton>
    </div>
  );
}
