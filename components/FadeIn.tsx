'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface FadeInProps {
  children: ReactNode;
  x: number;
  duration?: number;
  className?: string;
}

export default function FadeIn({ children, x, duration = 1, className }: FadeInProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
