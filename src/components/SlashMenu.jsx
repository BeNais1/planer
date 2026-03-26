import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HeadingIcon, TextIcon, TodoIcon, QuoteIcon, CodeIcon, DividerIcon } from './Icons';

const COMMANDS = [
  { id: 'heading1', label: 'Heading 1', desc: 'Large heading', icon: HeadingIcon, action: (e) => e.chain().focus().toggleHeading({ level: 1 }).run() },
  { id: 'heading2', label: 'Heading 2', desc: 'Medium heading', icon: HeadingIcon, action: (e) => e.chain().focus().toggleHeading({ level: 2 }).run() },
  { id: 'heading3', label: 'Heading 3', desc: 'Small heading', icon: HeadingIcon, action: (e) => e.chain().focus().toggleHeading({ level: 3 }).run() },
  { id: 'text', label: 'Text', desc: 'Plain paragraph', icon: TextIcon, action: (e) => e.chain().focus().setParagraph().run() },
  { id: 'todo', label: 'To-do List', desc: 'Checkable tasks', icon: TodoIcon, action: (e) => e.chain().focus().toggleTaskList().run() },
  { id: 'bullet', label: 'Bullet List', desc: 'Simple list', icon: TextIcon, action: (e) => e.chain().focus().toggleBulletList().run() },
  { id: 'quote', label: 'Quote', desc: 'Blockquote', icon: QuoteIcon, action: (e) => e.chain().focus().toggleBlockquote().run() },
  { id: 'code', label: 'Code Block', desc: 'Code with highlighting', icon: CodeIcon, action: (e) => e.chain().focus().toggleCodeBlock().run() },
  { id: 'divider', label: 'Divider', desc: 'Horizontal line', icon: DividerIcon, action: (e) => e.chain().focus().setHorizontalRule().run() },
];

export default function SlashMenu({ editor }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const menuRef = useRef(null);

  const filtered = COMMANDS.filter(
    (c) => c.label.toLowerCase().includes(query.toLowerCase()) ||
           c.desc.toLowerCase().includes(query.toLowerCase())
  );

  // Listen for "/" typed in editor
  useEffect(() => {
    if (!editor) return;

    const handleKeyDown = (event) => {
      if (event.key === '/' && !isOpen) {
        // Get cursor position
        const { view } = editor;
        const { from } = view.state.selection;
        const coords = view.coordsAtPos(from);
        const editorRect = view.dom.closest('.block-editor')?.getBoundingClientRect() || { top: 0, left: 0 };

        setPosition({
          top: coords.bottom - editorRect.top + 4,
          left: coords.left - editorRect.left,
        });
        setIsOpen(true);
        setQuery('');
        setSelected(0);
      }
    };

    const handleInput = () => {
      if (isOpen) {
        const { state } = editor;
        const { from } = state.selection;
        const textBefore = state.doc.textBetween(
          Math.max(0, from - 20),
          from
        );
        const slashIdx = textBefore.lastIndexOf('/');
        if (slashIdx >= 0) {
          setQuery(textBefore.slice(slashIdx + 1));
        } else {
          setIsOpen(false);
        }
      }
    };

    editor.view.dom.addEventListener('keydown', handleKeyDown);
    editor.on('update', handleInput);

    return () => {
      editor.view.dom.removeEventListener('keydown', handleKeyDown);
      editor.off('update', handleInput);
    };
  }, [editor, isOpen]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKey = (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelected((s) => Math.min(s + 1, filtered.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelected((s) => Math.max(s - 1, 0));
      } else if (e.key === 'Enter' && filtered.length > 0) {
        e.preventDefault();
        executeCommand(filtered[selected]);
      } else if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKey, true);
    return () => document.removeEventListener('keydown', handleKey, true);
  }, [isOpen, selected, filtered]);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen]);

  const executeCommand = useCallback((cmd) => {
    // Delete the "/" and query text
    const { state } = editor;
    const { from } = state.selection;
    const textBefore = state.doc.textBetween(Math.max(0, from - 20), from);
    const slashIdx = textBefore.lastIndexOf('/');
    if (slashIdx >= 0) {
      const deleteFrom = from - (textBefore.length - slashIdx);
      editor.chain().focus().deleteRange({ from: deleteFrom, to: from }).run();
    }
    cmd.action(editor);
    setIsOpen(false);
  }, [editor]);

  if (!isOpen || filtered.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        ref={menuRef}
        className="slash-menu"
        style={{ top: position.top, left: position.left }}
        initial={{ opacity: 0, y: -8, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -8, scale: 0.96 }}
        transition={{ duration: 0.15 }}
      >
        <div className="slash-menu-label">Blocks</div>
        {filtered.map((cmd, idx) => {
          const Icon = cmd.icon;
          return (
            <div
              key={cmd.id}
              className={`slash-menu-item ${idx === selected ? 'selected' : ''}`}
              onClick={() => executeCommand(cmd)}
              onMouseEnter={() => setSelected(idx)}
            >
              <div className="slash-menu-icon"><Icon /></div>
              <div>
                <div className="slash-menu-item-title">{cmd.label}</div>
                <div className="slash-menu-item-desc">{cmd.desc}</div>
              </div>
            </div>
          );
        })}
      </motion.div>
    </AnimatePresence>
  );
}
