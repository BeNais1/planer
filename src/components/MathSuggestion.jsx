import React, { useState, useEffect } from 'react';

function safeEval(expr) {
  try {
    const cleanExpr = expr.replace(/[^\d\.\+\-\*\/\(\)]/g, ''); // strip all non-math chars
    
    // Require at least one operator and one number
    if (!/[\+\-\*\/]/.test(cleanExpr) || !/\d/.test(cleanExpr)) return null;
    
    // eslint-disable-next-line no-new-func
    const res = new Function(`"use strict"; return (${cleanExpr})`)();
    
    if (typeof res === 'number' && !isNaN(res) && isFinite(res)) {
      return Math.round(res * 100000) / 100000;
    }
  } catch (e) {
    return null;
  }
  return null;
}

export default function MathSuggestion({ editor }) {
  const [suggestion, setSuggestion] = useState(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const isVisible = suggestion !== null;

  useEffect(() => {
    if (!editor) return;

    const handleInput = () => {
      const { state, view } = editor;
      const { from, to } = state.selection;
      
      if (from !== to) {
        setSuggestion(null);
        return;
      }

      const textBefore = state.doc.textBetween(Math.max(0, from - 60), from, '\n');
      
      // Match anything ending in =
      const match = textBefore.match(/([\d\.\+\-\*\/\(\)\s]+)=\s*$/);
      
      if (match) {
        const result = safeEval(match[1]);
        if (result !== null) {
          const coords = view.coordsAtPos(from);
          const editorRect = view.dom.closest('.block-editor')?.getBoundingClientRect() || { top: 0, left: 0 };
          
          setPosition({
            top: coords.top - editorRect.top,
            left: coords.left - editorRect.left + 8,
          });
          setSuggestion(result);
          return;
        }
      }
      setSuggestion(null);
    };

    const handleKeyDown = (event) => {
      if (isVisible && event.key === 'Tab') {
        event.preventDefault();
        event.stopPropagation();
        
        editor.chain().focus().insertContent(suggestion.toString()).run();
        setSuggestion(null);
      } else if (isVisible && (event.key === 'Escape' || event.key === ' ' || event.key === 'Enter')) {
        setSuggestion(null);
      }
    };

    editor.on('update', handleInput);
    editor.on('selectionUpdate', handleInput);
    editor.view.dom.addEventListener('keydown', handleKeyDown, true);

    return () => {
      editor.off('update', handleInput);
      editor.off('selectionUpdate', handleInput);
      editor.view.dom.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [editor, isVisible, suggestion]);

  if (!isVisible) return null;

  return (
    <div
      className="math-suggestion-badge"
      style={{ 
        position: 'absolute',
        top: position.top, 
        left: position.left,
        zIndex: 50,
        opacity: 1,
        transition: 'opacity 0.2s ease, transform 0.2s ease',
        transform: 'translateY(-2px)'
      }}
    >
      <span className="math-badge-icon">✨</span>
      <span className="math-badge-text">{suggestion}</span>
      <span className="math-badge-key">Tab ⇥</span>
    </div>
  );
}
