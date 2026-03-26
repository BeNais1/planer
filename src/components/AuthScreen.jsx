import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { signInWithPopup, GoogleAuthProvider, signInAnonymously } from 'firebase/auth';
import { auth } from '../firebase';
import logoSrc from '../assets/logo.svg';

const googleProvider = new GoogleAuthProvider();

export default function AuthScreen({ onAuthSuccess }) {
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState(null);

  const handleGoogle = async () => {
    setIsSigningIn(true);
    setError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      onAuthSuccess(result.user);
    } catch (err) {
      console.error('Google sign-in error:', err);
      let errorMsg = 'Не вдалося увійти через Google';
      if (err.code === 'auth/popup-closed-by-user') {
        errorMsg = 'Вікно входу було закрито.';
      } else if (err.code === 'auth/unauthorized-domain') {
        errorMsg = `Домен не авторизовано. Перевір налаштування Firebase.`;
      } else if (err.message) {
        errorMsg = `Помилка: ${err.message}`;
      }
      setError(errorMsg);
      setIsSigningIn(false);
    }
  };

  const handleGuest = async () => {
    setIsSigningIn(true);
    setError(null);
    try {
      const result = await signInAnonymously(auth);
      onAuthSuccess(result.user);
    } catch (err) {
      console.error('Anonymous sign-in error:', err);
      setError('Помилка підключення');
      setIsSigningIn(false);
    }
  };

  return (
    <motion.div
      className="auth-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.02 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.div
        className="auth-card"
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <motion.img
          src={logoSrc}
          alt="Planer"
          className="auth-logo"
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15, duration: 0.5 }}
        />

        <h1 className="auth-title">Welcome to Planer</h1>
        <p className="auth-subtitle">Увійдіть, щоб синхронізувати ваші нотатки</p>

        <motion.button
          className="auth-btn auth-btn-google"
          onClick={handleGoogle}
          disabled={isSigningIn}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <svg className="auth-google-icon" viewBox="0 0 24 24" width="20" height="20">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Увійти через Google
        </motion.button>

        <div className="auth-divider">
          <span>або</span>
        </div>

        <motion.button
          className="auth-btn auth-btn-guest"
          onClick={handleGuest}
          disabled={isSigningIn}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Продовжити як гість
        </motion.button>

        {error && (
          <motion.p
            className="auth-error"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {error}
          </motion.p>
        )}
      </motion.div>
    </motion.div>
  );
}
