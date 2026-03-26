import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { PageIcon, TaskIcon, SunIcon, MoonIcon, GraphIcon } from './Icons';
import logoSrc from '../assets/logo.svg';

export default function Sidebar({
  pages,
  activePageId,
  onSelectPage,
  onCreatePage,
  onDeletePage,
  searchQuery,
  onSearchChange,
  onOpenGraph,
  currentUser,
  onSignOut,
}) {
  const { theme, toggleTheme } = useTheme();

  return (
    <aside className="sidebar">
      {/* Header */}
      <div className="sidebar-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="sidebar-logo">
            <img src={logoSrc} alt="Planer" className="sidebar-logo-img" />
            Planer
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            <button
              className="sidebar-icon-btn"
              onClick={onOpenGraph}
              title="Graph View"
            >
              <GraphIcon />
            </button>
            <button
              className="sidebar-icon-btn"
              onClick={toggleTheme}
              title={theme === 'light' ? 'Dark mode' : 'Light mode'}
            >
              {theme === 'light' ? <MoonIcon /> : <SunIcon />}
            </button>
          </div>
        </div>
        <div className="sidebar-subtitle">Your workspace</div>
      </div>

      {/* Search */}
      <div className="sidebar-search">
        <input
          className="search-input"
          type="text"
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      {/* Section header */}
      <div className="sidebar-section">
        <span className="sidebar-section-title">Pages</span>
        <button className="sidebar-section-btn" onClick={onCreatePage}>+</button>
      </div>

      {/* Page list */}
      <div className="page-list">
        <AnimatePresence>
          {pages.map((page) => (
            <motion.div
              key={page.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12, height: 0, marginBottom: 0 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              className={`page-item ${page.id === activePageId ? 'active' : ''}`}
              onClick={() => onSelectPage(page.id)}
            >
              <div className="page-item-icon">
                {page.type === 'tasks' ? <TaskIcon /> : <PageIcon />}
              </div>
              <span className="page-item-title">
                {page.title || 'Untitled'}
              </span>
              <button
                className="page-item-delete"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeletePage(page.id);
                }}
              >
                ×
              </button>
            </motion.div>
          ))}
        </AnimatePresence>

        {pages.length === 0 && (
          <div style={{
            padding: '24px 12px',
            textAlign: 'center',
            color: 'var(--text-tertiary)',
            fontSize: 13,
          }}>
            No pages yet
          </div>
        )}
      </div>

      {/* Bottom section */}
      <div className="sidebar-bottom">
        <button className="new-page-btn" onClick={onCreatePage}>
          <span>+</span> New Page
        </button>
        
        <div className="sidebar-auth-panel">
          <div className="sidebar-auth-user">
            {currentUser?.isAnonymous ? 'Guest' : currentUser?.displayName || currentUser?.email || 'User'}
          </div>
          <button className="sidebar-signout-btn" onClick={onSignOut} title="Sign Out">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
          </button>
        </div>
      </div>
    </aside>
  );
}
