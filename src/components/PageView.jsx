import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import TaskList from './TaskList';
import BlockEditor from './BlockEditor';

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
