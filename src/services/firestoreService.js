import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from '../firebase';

// ── Pages ────────────────────────────────────────────────────

export async function getPages(userId) {
  const q = query(
    collection(db, 'users', userId, 'pages'),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function savePage(userId, page) {
  const ref = doc(db, 'users', userId, 'pages', page.id);
  await setDoc(ref, page, { merge: true });
}

export async function removePageFromDB(userId, pageId) {
  await deleteDoc(doc(db, 'users', userId, 'pages', pageId));
}

// ── Tasks ────────────────────────────────────────────────────

export async function getTasks(userId) {
  const q = query(
    collection(db, 'users', userId, 'tasks'),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function saveTask(userId, task) {
  const ref = doc(db, 'users', userId, 'tasks', task.id);
  await setDoc(ref, task, { merge: true });
}

export async function removeTaskFromDB(userId, taskId) {
  await deleteDoc(doc(db, 'users', userId, 'tasks', taskId));
}

// ── Real-time sync ───────────────────────────────────────────

export function subscribeToData(userId, onPagesUpdate, onTasksUpdate) {
  const unsubPages = onSnapshot(
    query(collection(db, 'users', userId, 'pages'), orderBy('createdAt', 'desc')),
    (snapshot) => {
      const pages = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      onPagesUpdate(pages);
    }
  );

  const unsubTasks = onSnapshot(
    query(collection(db, 'users', userId, 'tasks'), orderBy('createdAt', 'desc')),
    (snapshot) => {
      const tasks = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      onTasksUpdate(tasks);
    }
  );

  return () => {
    unsubPages();
    unsubTasks();
  };
}
