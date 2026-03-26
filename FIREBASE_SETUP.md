# 🔥 Підключення Planer до Firebase

Цей гайд пояснює, як підключити додаток Planer до Firebase для хмарного зберігання заміток та синхронізації між пристроями.

---

## 1. Створення проекту Firebase

1. Перейди на [Firebase Console](https://console.firebase.google.com/)
2. Натисни **"Add Project"** (Створити проект)
3. Введи назву проекту, наприклад `planer-app`
4. Google Analytics — можна вимкнути (не обов'язково)
5. Натисни **"Create Project"**

---

## 2. Додавання веб-додатку

1. У Firebase Console вибери свій проект
2. Натисни іконку **</>** (Web) на головній сторінці проекту
3. Введи назву додатку: `Planer`
4. **НЕ** вмикай Firebase Hosting (не потрібно для Electron)
5. Натисни **"Register App"**
6. Скопіюй конфігурацію — вона виглядає приблизно так:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "planer-app.firebaseapp.com",
  projectId: "planer-app",
  storageBucket: "planer-app.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};
```

---

## 3. Встановлення Firebase SDK

Відкрий термінал у папці проекту і виконай:

```bash
npm install firebase
```

---

## 4. Створення файлу конфігурації

Створи файл `src/firebase.js`:

```javascript
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Встав сюди СВОЮ конфігурацію з Firebase Console
const firebaseConfig = {
  apiKey: "ТВІЙ_API_KEY",
  authDomain: "ТВІЙ_PROJECT.firebaseapp.com",
  projectId: "ТВІЙ_PROJECT_ID",
  storageBucket: "ТВІЙ_PROJECT.appspot.com",
  messagingSenderId: "ТВІЙ_SENDER_ID",
  appId: "ТВІЙ_APP_ID"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
export default app;
```

> ⚠️ **ВАЖЛИВО:** Ніколи не комітьте `firebaseConfig` з реальними ключами у публічний репозиторій! Використовуйте `.env` файл (див. розділ 8).

---

## 5. Налаштування Firestore (база даних)

### В Firebase Console:

1. Ліве меню → **Build** → **Firestore Database**
2. Натисни **"Create Database"**
3. Обери **"Start in test mode"** (для розробки)
4. Обери регіон, найближчий до тебе (наприклад, `europe-west1`)
5. Натисни **"Enable"**

### Структура бази даних для Planer:

```
users/
  └── {userId}/
        ├── pages/
        │     ├── {pageId}/
        │     │     ├── title: "My Page"
        │     │     ├── content: "..."
        │     │     ├── type: "notes"
        │     │     └── createdAt: Timestamp
        │     └── ...
        └── tasks/
              ├── {taskId}/
              │     ├── pageId: "..."
              │     ├── title: "My Task"
              │     ├── completed: false
              │     ├── priority: "medium"
              │     ├── dueDate: null
              │     └── createdAt: Timestamp
              └── ...
```

---

## 6. Створення сервісу для роботи з Firestore

Створи файл `src/services/firestoreService.js`:

```javascript
import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy
} from 'firebase/firestore';
import { db } from '../firebase';

// ── Pages ──────────────────────────────────────────

export async function getPages(userId) {
  const q = query(
    collection(db, 'users', userId, 'pages'),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function savePage(userId, page) {
  const pageRef = doc(db, 'users', userId, 'pages', page.id);
  await setDoc(pageRef, page, { merge: true });
}

export async function deletePage(userId, pageId) {
  await deleteDoc(doc(db, 'users', userId, 'pages', pageId));
}

// ── Tasks ──────────────────────────────────────────

export async function getTasks(userId) {
  const q = query(
    collection(db, 'users', userId, 'tasks'),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function saveTask(userId, task) {
  const taskRef = doc(db, 'users', userId, 'tasks', task.id);
  await setDoc(taskRef, task, { merge: true });
}

export async function deleteTask(userId, taskId) {
  await deleteDoc(doc(db, 'users', userId, 'tasks', taskId));
}

// ── Real-time Listener (синхронізація в реальному часі) ────

export function subscribeToPagesAndTasks(userId, onUpdate) {
  const unsubPages = onSnapshot(
    collection(db, 'users', userId, 'pages'),
    (snapshot) => {
      const pages = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      onUpdate({ pages });
    }
  );

  const unsubTasks = onSnapshot(
    collection(db, 'users', userId, 'tasks'),
    (snapshot) => {
      const tasks = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      onUpdate({ tasks });
    }
  );

  // Повертає функцію для відписки
  return () => {
    unsubPages();
    unsubTasks();
  };
}
```

---

## 7. Аутентифікація (опціонально)

Якщо хочеш, щоб кожен юзер мав свої заметки:

### В Firebase Console:

1. **Build** → **Authentication**
2. **"Get Started"**
3. Увімкни потрібні провайдери:
   - **Email/Password** — базова аутентифікація
   - **Google** — вхід через Google акаунт
   - **Anonymous** — анонімний вхід (найпростіше для початку)

### Код для анонімного входу (найпростіший варіант):

```javascript
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';

// Викликай при старті додатку
export async function initAuth() {
  return new Promise((resolve) => {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        resolve(user.uid);
      } else {
        signInAnonymously(auth).then((result) => {
          resolve(result.user.uid);
        });
      }
    });
  });
}
```

### Код для входу через Google:

```javascript
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../firebase';

const provider = new GoogleAuthProvider();

export async function signInWithGoogle() {
  const result = await signInWithPopup(auth, provider);
  return result.user;
}
```

---

## 8. Використання `.env` для безпеки

Створи файл `.env` в корені проекту:

```env
VITE_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXX
VITE_FIREBASE_AUTH_DOMAIN=planer-app.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=planer-app
VITE_FIREBASE_STORAGE_BUCKET=planer-app.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
```

Оновлений `src/firebase.js`:

```javascript
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};
```

Додай `.env` у `.gitignore`:

```
.env
```

---

## 9. Правила безпеки Firestore (для продакшн)

В Firebase Console → Firestore → **Rules**, заміни правила на:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Кожен юзер має доступ тільки до своїх даних
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

---

## 10. Інтеграція з поточним кодом Planer

Зараз `App.jsx` зберігає дані через Electron IPC (локальний JSON файл). Щоб перейти на Firebase, потрібно:

1. Ініціалізувати auth при старті
2. Замінити `window.electronAPI.loadData()` на `getPages(userId)` + `getTasks(userId)`
3. Замінити `window.electronAPI.saveData()` на виклики `savePage()` / `saveTask()`
4. Додати real-time listener для синхронізації

### Приклад модифікації завантаження в `App.jsx`:

```javascript
import { initAuth } from './services/authService';
import { getPages, getTasks, subscribeToPagesAndTasks } from './services/firestoreService';

// В useEffect для завантаження:
useEffect(() => {
  async function load() {
    const userId = await initAuth();

    const [pages, tasks] = await Promise.all([
      getPages(userId),
      getTasks(userId),
    ]);

    setPages(pages);
    setTasks(tasks);

    // Real-time синхронізація
    const unsubscribe = subscribeToPagesAndTasks(userId, (update) => {
      if (update.pages) setPages(update.pages);
      if (update.tasks) setTasks(update.tasks);
    });

    return () => unsubscribe();
  }
  load();
}, []);
```

---

## Корисні посилання

- 📖 [Firebase Documentation](https://firebase.google.com/docs)
- 📖 [Firestore Guide](https://firebase.google.com/docs/firestore)
- 📖 [Firebase Auth Guide](https://firebase.google.com/docs/auth)
- 📖 [Vite Env Variables](https://vitejs.dev/guide/env-and-mode)
