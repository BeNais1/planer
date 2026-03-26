import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { ThemeProvider } from './context/ThemeContext';
import Sidebar from './components/Sidebar';
import PageView from './components/PageView';
import Welcome from './components/Welcome';
import GraphView from './components/GraphView';
import SplashScreen from './components/SplashScreen';
import AuthScreen from './components/AuthScreen';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './firebase';
import {
  getPages, getTasks,
  savePage, saveTask,
  removePageFromDB, removeTaskFromDB,
  subscribeToData,
} from './services/firestoreService';

// ── Helpers ──────────────────────────────────────────────────

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

// ── App ──────────────────────────────────────────────────────

function AppContent() {
  const [pages, setPages] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [activePageId, setActivePageId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showGraph, setShowGraph] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);
  const [currentUser, setCurrentUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const userIdRef = useRef(null);
  const unsubDataRef = useRef(null);

  // ── Check existing auth session on mount ──────────────────
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user && !user.isAnonymous) {
        // Only auto-login for Google (non-anonymous) users
        setCurrentUser(user);
        userIdRef.current = user.uid;
      }
      setAuthChecked(true);
    });
    return () => unsub();
  }, []);

  // ── Load data once user is authenticated ──────────────────
  useEffect(() => {
    if (!currentUser) return;

    async function loadData() {
      setIsLoading(true);
      setLoadProgress(10);
      await new Promise(r => setTimeout(r, 300));
      setLoadProgress(30);

      try {
        const uid = currentUser.uid;
        const [fbPages, fbTasks] = await Promise.all([
          getPages(uid),
          getTasks(uid),
        ]);
        setLoadProgress(70);

        setPages(fbPages);
        setTasks(fbTasks);
        if (fbPages.length > 0) {
          setActivePageId(fbPages[0].id);
        }

        // Real-time sync
        if (unsubDataRef.current) unsubDataRef.current();
        unsubDataRef.current = subscribeToData(
          uid,
          (livePages) => setPages(livePages),
          (liveTasks) => setTasks(liveTasks),
        );
      } catch (err) {
        console.warn('Firebase load failed, using local:', err);
        try {
          const data = await window.electronAPI.loadData();
          setPages(data.pages || []);
          setTasks(data.tasks || []);
          if (data.pages?.length > 0) setActivePageId(data.pages[0].id);
        } catch {
          const saved = localStorage.getItem('planer-data');
          if (saved) {
            const data = JSON.parse(saved);
            setPages(data.pages || []);
            setTasks(data.tasks || []);
            if (data.pages?.length > 0) setActivePageId(data.pages[0].id);
          }
        }
      }

      setLoadProgress(90);
      try { window.electronAPI.splashDone(); } catch { /* Not Electron */ }
      await new Promise(r => setTimeout(r, 600));
      setLoadProgress(100);
      await new Promise(r => setTimeout(r, 300));
      setIsLoading(false);
    }

    loadData();

    return () => {
      if (unsubDataRef.current) unsubDataRef.current();
    };
  }, [currentUser]);

  // ── Auth handlers ─────────────────────────────────────────
  const handleAuthSuccess = (user) => {
    setCurrentUser(user);
    userIdRef.current = user.uid;
  };

  const handleSignOut = async () => {
    try {
      if (unsubDataRef.current) unsubDataRef.current();
      await signOut(auth);
      setCurrentUser(null);
      userIdRef.current = null;
      setPages([]);
      setTasks([]);
      setActivePageId(null);
      setIsLoading(true);
      setLoadProgress(0);
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  // ── Local save (backup) ────────────────────────────────────
  const saveLocal = useCallback((newPages, newTasks) => {
    const data = { pages: newPages, tasks: newTasks };
    try {
      window.electronAPI.saveData(data);
    } catch {
      localStorage.setItem('planer-data', JSON.stringify(data));
    }
  }, []);

  // ── Page CRUD ─────────────────────────────────────────────

  const createPage = useCallback(() => {
    const newPage = {
      id: generateId(),
      title: 'Untitled',
      content: '',
      type: 'notes',
      createdAt: new Date().toISOString(),
    };
    const updated = [...pages, newPage];
    setPages(updated);
    setActivePageId(newPage.id);
    saveLocal(updated, tasks);
    if (userIdRef.current) savePage(userIdRef.current, newPage);
  }, [pages, tasks, saveLocal]);

  const updatePage = useCallback((id, changes) => {
    const updated = pages.map(p => p.id === id ? { ...p, ...changes } : p);
    setPages(updated);
    saveLocal(updated, tasks);
    const updatedPage = updated.find(p => p.id === id);
    if (userIdRef.current && updatedPage) savePage(userIdRef.current, updatedPage);
  }, [pages, tasks, saveLocal]);

  const deletePage = useCallback((id) => {
    const updated = pages.filter(p => p.id !== id);
    const updatedTasks = tasks.filter(t => t.pageId !== id);
    setPages(updated);
    setTasks(updatedTasks);
    if (activePageId === id) {
      setActivePageId(updated.length > 0 ? updated[0].id : null);
    }
    saveLocal(updated, updatedTasks);
    if (userIdRef.current) {
      removePageFromDB(userIdRef.current, id);
      tasks.filter(t => t.pageId === id).forEach(t => {
        removeTaskFromDB(userIdRef.current, t.id);
      });
    }
  }, [pages, tasks, activePageId, saveLocal]);

  // ── Task CRUD ─────────────────────────────────────────────

  const createTask = useCallback((pageId, title, priority = 'medium', dueDate = null) => {
    const newTask = {
      id: generateId(),
      pageId,
      title,
      completed: false,
      priority,
      dueDate,
      createdAt: new Date().toISOString(),
    };
    const updated = [...tasks, newTask];
    setTasks(updated);
    saveLocal(pages, updated);
    if (userIdRef.current) saveTask(userIdRef.current, newTask);
  }, [pages, tasks, saveLocal]);

  const toggleTask = useCallback((id) => {
    const updated = tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
    setTasks(updated);
    saveLocal(pages, updated);
    const toggled = updated.find(t => t.id === id);
    if (userIdRef.current && toggled) saveTask(userIdRef.current, toggled);
  }, [pages, tasks, saveLocal]);

  const deleteTask = useCallback((id) => {
    const updated = tasks.filter(t => t.id !== id);
    setTasks(updated);
    saveLocal(pages, updated);
    if (userIdRef.current) removeTaskFromDB(userIdRef.current, id);
  }, [pages, tasks, saveLocal]);

  const reorderTasks = useCallback((pageId, orderedIds) => {
    const otherTasks = tasks.filter(t => t.pageId !== pageId);
    const pageTasks = orderedIds
      .map(id => tasks.find(t => t.id === id))
      .filter(Boolean);
    const updated = [...otherTasks, ...pageTasks];
    setTasks(updated);
    saveLocal(pages, updated);
  }, [pages, tasks, saveLocal]);

  // ── Derived state ────────────────────────────────────────

  const activePage = pages.find(p => p.id === activePageId) || null;
  const pageTasks = tasks.filter(t => t.pageId === activePageId);

  const filteredPages = searchQuery
    ? pages.filter(p => p.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : pages;

  // Wait for auth check
  if (!authChecked) {
    return <SplashScreen progress={5} />;
  }

  // Not logged in → show auth screen
  if (!currentUser) {
    return (
      <AnimatePresence mode="wait">
        <AuthScreen key="auth" onAuthSuccess={handleAuthSuccess} />
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence mode="wait">
      {isLoading ? (
        <SplashScreen key="splash" progress={loadProgress} />
      ) : (
        <div className="app" key="app">
          <Sidebar
            pages={filteredPages}
            activePageId={activePageId}
            onSelectPage={setActivePageId}
            onCreatePage={createPage}
            onDeletePage={deletePage}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onOpenGraph={() => setShowGraph(true)}
            currentUser={currentUser}
            onSignOut={handleSignOut}
          />

          <div className="main-content">
            <AnimatePresence mode="wait">
              {activePage ? (
                <PageView
                  key={activePage.id}
                  page={activePage}
                  tasks={pageTasks}
                  onUpdatePage={updatePage}
                  onCreateTask={createTask}
                  onToggleTask={toggleTask}
                  onDeleteTask={deleteTask}
                  onReorderTasks={reorderTasks}
                />
              ) : (
                <Welcome key="welcome" onCreatePage={createPage} />
              )}
            </AnimatePresence>
          </div>

          {/* Graph View overlay */}
          <AnimatePresence>
            {showGraph && (
              <GraphView
                pages={pages}
                onSelectPage={(id) => { setActivePageId(id); }}
                onClose={() => setShowGraph(false)}
              />
            )}
          </AnimatePresence>
        </div>
      )}
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
