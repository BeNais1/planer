import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { format, isPast, isToday, parseISO } from 'date-fns';
import { CheckIcon, DragIcon } from './Icons';

const taskVariants = {
  initial: { opacity: 0, y: 10, scale: 0.97 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, x: -20, height: 0, marginBottom: 0, padding: 0, overflow: 'hidden' },
};

export default function TaskList({ pageId, tasks, onCreateTask, onToggleTask, onDeleteTask, onReorderTasks }) {
  const [newTitle, setNewTitle] = useState('');
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleAdd = () => {
    if (!newTitle.trim()) return;
    onCreateTask(pageId, newTitle.trim(), priority, dueDate || null);
    setNewTitle('');
    setDueDate('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleAdd();
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = tasks.findIndex(t => t.id === active.id);
    const newIndex = tasks.findIndex(t => t.id === over.id);
    const reordered = arrayMove(tasks, oldIndex, newIndex);
    onReorderTasks(pageId, reordered.map(t => t.id));
  };

  const activeTasks = tasks.filter(t => !t.completed);
  const completedTasks = tasks.filter(t => t.completed);

  return (
    <>
      {/* Input row */}
      <div className="task-input-row">
        <input
          className="task-input"
          type="text"
          placeholder="Add a new task..."
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={handleKeyDown}
        />

        <div className="priority-group">
          {['low', 'medium', 'high'].map((p) => (
            <button
              key={p}
              className={`priority-btn ${p} ${priority === p ? 'active' : ''}`}
              onClick={() => setPriority(p)}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>

        <input
          className="task-date-input"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          title="Due date"
        />

        <button className="task-add-btn" onClick={handleAdd}>Add</button>
      </div>

      {/* Active tasks with DnD */}
      {tasks.length === 0 && (
        <motion.div
          className="empty-state"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          No tasks yet. Add one above!
        </motion.div>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={activeTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          <AnimatePresence>
            {activeTasks.map((task, i) => (
              <SortableTaskCard
                key={task.id}
                task={task}
                index={i}
                onToggle={onToggleTask}
                onDelete={onDeleteTask}
              />
            ))}
          </AnimatePresence>
        </SortableContext>
      </DndContext>

      {/* Completed section */}
      {completedTasks.length > 0 && (
        <>
          <motion.div
            className="task-section-title"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
          >
            Completed ({completedTasks.length})
          </motion.div>

          <AnimatePresence>
            {completedTasks.map((task, i) => (
              <TaskCard
                key={task.id}
                task={task}
                index={i}
                onToggle={onToggleTask}
                onDelete={onDeleteTask}
              />
            ))}
          </AnimatePresence>
        </>
      )}
    </>
  );
}

function SortableTaskCard({ task, index, onToggle, onDelete }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.85 : 1,
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      className={`task-card ${isDragging ? 'dragging' : ''}`}
      variants={taskVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.3, delay: index * 0.04, ease: [0.16, 1, 0.3, 1] }}
      layout
    >
      <div className="task-drag-handle" {...attributes} {...listeners}>
        <DragIcon />
      </div>
      <div className={`task-priority-dot ${task.priority}`} />
      <div
        className={`task-checkbox ${task.completed ? 'checked' : ''}`}
        onClick={() => onToggle(task.id)}
      >
        <CheckIcon />
      </div>
      <span className={`task-title ${task.completed ? 'completed' : ''}`}>
        {task.title}
      </span>
      {task.dueDate && <DueDateBadge date={task.dueDate} />}
      <button className="task-delete" onClick={() => onDelete(task.id)}>×</button>
    </motion.div>
  );
}

function TaskCard({ task, index, onToggle, onDelete }) {
  return (
    <motion.div
      className="task-card"
      variants={taskVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.3, delay: index * 0.04, ease: [0.16, 1, 0.3, 1] }}
      layout
    >
      <div className={`task-priority-dot ${task.priority}`} />
      <div
        className={`task-checkbox ${task.completed ? 'checked' : ''}`}
        onClick={() => onToggle(task.id)}
      >
        <CheckIcon />
      </div>
      <span className={`task-title ${task.completed ? 'completed' : ''}`}>
        {task.title}
      </span>
      {task.dueDate && <DueDateBadge date={task.dueDate} />}
      <button className="task-delete" onClick={() => onDelete(task.id)}>×</button>
    </motion.div>
  );
}

function DueDateBadge({ date }) {
  let parsed;
  try {
    parsed = parseISO(date);
  } catch {
    return null;
  }

  const isOverdue = isPast(parsed) && !isToday(parsed);
  const isDueToday = isToday(parsed);
  const label = format(parsed, 'MMM d');

  let className = 'task-due-badge';
  if (isOverdue) className += ' overdue';
  else if (isDueToday) className += ' due-today';

  return <span className={className}>{label}</span>;
}
