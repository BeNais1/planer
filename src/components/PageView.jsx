import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import html2pdf from 'html2pdf.js';
import TaskList from './TaskList';
import BlockEditor from './BlockEditor';
import logoSrc from '../assets/logo.svg';

const pageVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.2 } },
};

export default function PageView({
  page,
  tasks,
  onUpdatePage,
  onCreateTask,
  onToggleTask,
  onDeleteTask,
  onReorderTasks,
}) {
  const [title, setTitle] = useState(page.title);
  const saveTimer = useRef(null);

  useEffect(() => {
    setTitle(page.title);
  }, [page.id, page.title]);

  const handleTitleChange = (e) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      onUpdatePage(page.id, { title: newTitle || 'Untitled' });
    }, 400);
  };

  const handleTitleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.target.blur();
      if (saveTimer.current) clearTimeout(saveTimer.current);
      onUpdatePage(page.id, { title: title || 'Untitled' });
    }
  };

  const handleTypeChange = (type) => {
    onUpdatePage(page.id, { type });
  };

  const handleExportPdf = () => {
    const element = document.createElement('div');
    element.style.padding = '0';
    element.style.margin = '0';
    
    const displayTitle = title || 'Untitled';
    const dateStr = new Date().toLocaleDateString();

    const coverPage = `
      <div style="height: 1040px; display: flex; flex-direction: column; justify-content: center; align-items: center; page-break-after: always; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <img src="${logoSrc}" style="width: 140px; height: 140px; margin-bottom: 24px;" crossorigin="anonymous"/>
        <h1 style="font-size: 48px; font-weight: 700; color: #1D1D1F; margin: 0 0 16px 0; letter-spacing: -1px;">Planer</h1>
        <div style="width: 50px; height: 4px; background: linear-gradient(135deg, #FF6B6B, #FF8E53); margin-bottom: 50px; border-radius: 2px;"></div>
        <h2 style="font-size: 36px; font-weight: 600; color: #333; margin: 0;">${displayTitle}</h2>
        <p style="font-size: 18px; color: #888; margin-top: 20px;">Оновлено: ${dateStr}</p>
      </div>
    `;

    const contentNode = document.querySelector('.content-body');
    // Replace SVGs or interactive react-beautiful-dnd buttons before PDF rendering
    let contentHTML = contentNode ? contentNode.innerHTML : '';
    contentHTML = contentHTML.replace(/<button.*?<\/button>/g, '');

    const contentPage = `
      <div style="padding: 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1D1D1F; line-height: 1.6;">
        <style>
          .task-item { display: flex; align-items: flex-start; margin-bottom: 12px; }
          .task-checkbox-wrapper { margin-right: 12px; margin-top: 2px; }
          .task-content { flex: 1; font-size: 18px; }
          .task-text.completed { text-decoration: line-through; color: #888; }
          .block-editor-content p { margin-bottom: 14px; font-size: 18px; }
          .block-editor-content h1 { margin-top: 32px; margin-bottom: 16px; font-size: 32px; font-weight: 700; }
          .block-editor-content h2 { margin-top: 24px; margin-bottom: 12px; font-size: 26px; font-weight: 600; }
          .block-editor-content h3 { margin-top: 20px; margin-bottom: 10px; font-size: 20px; font-weight: 600; }
          .block-editor-content ul, .block-editor-content ol { margin-left: 20px; margin-bottom: 16px; font-size: 18px; }
          .block-editor-content blockquote { border-left: 4px solid #DFDFE1; padding-left: 16px; color: #666; font-style: italic; }
          .block-editor-content pre { background: #F5F5F7; padding: 16px; border-radius: 8px; font-family: monospace; font-size: 14px; }
          input[type="checkbox"] { width: 18px; height: 18px; }
        </style>
        ${contentHTML}
      </div>
    `;

    element.innerHTML = coverPage + contentPage;

    const opt = {
      margin:       0,
      filename:     `${displayTitle}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, letterRendering: true, backgroundColor: '#FFFFFF' },
      jsPDF:        { unit: 'px', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).save();
  };

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}
    >
      <div className="content-header">
        <input
          className="content-title"
          type="text"
          value={title}
          onChange={handleTitleChange}
          onKeyDown={handleTitleKeyDown}
          onBlur={() => {
            if (saveTimer.current) clearTimeout(saveTimer.current);
            onUpdatePage(page.id, { title: title || 'Untitled' });
          }}
          placeholder="Untitled"
        />

        <div className="type-toggle">
          <button
            className="type-toggle-btn"
            style={{ marginRight: 16, backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '6px' }}
            onClick={handleExportPdf}
            title="Завантажити як PDF"
          >
            📄 <span style={{ fontSize: '13px' }}>PDF</span>
          </button>
          <div style={{ height: '24px', width: '1px', backgroundColor: 'var(--border-color)', margin: '0 8px 0 0' }}></div>
          <button
            className={`type-toggle-btn ${page.type === 'notes' ? 'active' : ''}`}
            onClick={() => handleTypeChange('notes')}
          >
            Notes
          </button>
          <button
            className={`type-toggle-btn ${page.type === 'tasks' ? 'active' : ''}`}
            onClick={() => handleTypeChange('tasks')}
          >
            Tasks
          </button>
        </div>
      </div>

      <div className="content-divider" />

      <div className="content-body">
        {page.type === 'tasks' ? (
          <TaskList
            pageId={page.id}
            tasks={tasks}
            onCreateTask={onCreateTask}
            onToggleTask={onToggleTask}
            onDeleteTask={onDeleteTask}
            onReorderTasks={onReorderTasks}
          />
        ) : (
          <BlockEditor
            page={page}
            onUpdatePage={onUpdatePage}
          />
        )}
      </div>
    </motion.div>
  );
}
