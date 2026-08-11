import React from 'react';
import { motion } from 'framer-motion';

export const Terms = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="container mx-auto px-4 py-8"
    >
      <h1 className="text-3xl font-bold text-heading mb-6">Terms</h1>
      <div className="glass-card p-6">
        <p className="text-muted-foreground">This page is under construction.</p>
      </div>
    </motion.div>
  );
};
