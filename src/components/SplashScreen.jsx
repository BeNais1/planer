import React from 'react';
import { motion } from 'framer-motion';
import logoSrc from '../assets/logo.svg';

export default function SplashScreen({ progress }) {
  return (
    <motion.div
      className="splash-screen"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.img
        src={logoSrc}
        alt="Planer"
        className="splash-logo"
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      />

      <motion.div
        className="splash-title"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        Planer
      </motion.div>

      <motion.div
        className="splash-subtitle"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.4 }}
      >
        Loading your workspace...
      </motion.div>

      <motion.div
        className="splash-progress-track"
        initial={{ opacity: 0, width: 0 }}
        animate={{ opacity: 1, width: 200 }}
        transition={{ delay: 0.5, duration: 0.3 }}
      >
        <motion.div
          className="splash-progress-bar"
          initial={{ width: '0%' }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        />
      </motion.div>
    </motion.div>
  );
}
