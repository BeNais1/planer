import React, { useEffect, useRef, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Highlight from '@tiptap/extension-highlight';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';
import SlashMenu from './SlashMenu';

const lowlight = createLowlight(common);

export default function BlockEditor({ page, onUpdatePage }) {
  const saveTimer = useRef(null);
  const isInitialLoad = useRef(true);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false, // replaced by lowlight version
        heading: { levels: [1, 2, 3] },
      }),
      Placeholder.configure({
        placeholder: ({ node }) => {
          if (node.type.name === 'heading') {
            return 'Heading...';
          }
          return "Type '/' for commands, or start writing...";
        },
      }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Highlight.configure({ multicolor: true }),
      CodeBlockLowlight.configure({ lowlight }),
    ],
    content: page.content ? tryParseJSON(page.content) : '<p></p>',
    editorProps: {
      attributes: {
        class: 'block-editor-content',
      },
    },
    onUpdate: ({ editor }) => {
      if (isInitialLoad.current) return;

      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        const json = JSON.stringify(editor.getJSON());
        onUpdatePage(page.id, { content: json });
      }, 600);
    },
  });

  // Reset content when page changes
  useEffect(() => {
    if (editor && page) {
      isInitialLoad.current = true;
      const content = page.content ? tryParseJSON(page.content) : '<p></p>';
      editor.commands.setContent(content);
      setTimeout(() => {
        isInitialLoad.current = false;
      }, 50);
    }
  }, [page.id, editor]);

  // Save on unmount
  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  if (!editor) return null;

  return (
    <div className="block-editor">
      {/* Toolbar */}
      <div className="editor-toolbar">
        <button
          className={`toolbar-btn ${editor.isActive('bold') ? 'active' : ''}`}
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="Bold"
        >
          B
        </button>
        <button
          className={`toolbar-btn italic ${editor.isActive('italic') ? 'active' : ''}`}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="Italic"
        >
          I
        </button>
        <button
          className={`toolbar-btn ${editor.isActive('strike') ? 'active' : ''}`}
          onClick={() => editor.chain().focus().toggleStrike().run()}
          title="Strikethrough"
        >
          S
        </button>

        <div className="toolbar-divider" />

        <button
          className={`toolbar-btn ${editor.isActive('heading', { level: 1 }) ? 'active' : ''}`}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          title="Heading 1"
        >
          H1
        </button>
        <button
          className={`toolbar-btn ${editor.isActive('heading', { level: 2 }) ? 'active' : ''}`}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          title="Heading 2"
        >
          H2
        </button>
        <button
          className={`toolbar-btn ${editor.isActive('heading', { level: 3 }) ? 'active' : ''}`}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          title="Heading 3"
        >
          H3
        </button>

        <div className="toolbar-divider" />

        <button
          className={`toolbar-btn ${editor.isActive('bulletList') ? 'active' : ''}`}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title="Bullet List"
        >
          •
        </button>
        <button
          className={`toolbar-btn ${editor.isActive('orderedList') ? 'active' : ''}`}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          title="Numbered List"
        >
          1.
        </button>
        <button
          className={`toolbar-btn ${editor.isActive('taskList') ? 'active' : ''}`}
          onClick={() => editor.chain().focus().toggleTaskList().run()}
          title="Task List"
        >
          ✓
        </button>

        <div className="toolbar-divider" />

        <button
          className={`toolbar-btn ${editor.isActive('blockquote') ? 'active' : ''}`}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          title="Quote"
        >
          "
        </button>
        <button
          className={`toolbar-btn ${editor.isActive('codeBlock') ? 'active' : ''}`}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          title="Code Block"
        >
          {'</>'}
        </button>
        <button
          className="toolbar-btn"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title="Divider"
        >
          —
        </button>
      </div>

      {/* Slash Menu */}
      <SlashMenu editor={editor} />

      {/* Editor */}
      <EditorContent editor={editor} />
    </div>
  );
}

function tryParseJSON(content) {
  try {
    const parsed = JSON.parse(content);
    if (parsed && typeof parsed === 'object') return parsed;
  } catch {}
  // Fallback: treat as plain text
  if (typeof content === 'string' && content.trim()) {
    return `<p>${content}</p>`;
  }
  return '<p></p>';
}
