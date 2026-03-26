import React from 'react';
import { motion } from 'framer-motion';
import logoSrc from '../assets/logo.svg';

export default function Welcome({ onCreatePage }) {
  return (
    <motion.div
      className="welcome"
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.img
        src={logoSrc}
        alt="Planer Logo"
        className="welcome-logo"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.05, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      />

      <motion.div
        className="welcome-title"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4 }}
      >
        Welcome to Planer
      </motion.div>

      <motion.div
        className="welcome-subtitle"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        Create your first page to get started
      </motion.div>

      <motion.button
        className="welcome-btn"
        onClick={onCreatePage}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.97 }}
      >
        Create Page
      </motion.button>
    </motion.div>
  );
}
