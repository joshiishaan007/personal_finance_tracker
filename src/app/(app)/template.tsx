'use client';

import { motion, useReducedMotion } from 'framer-motion';

export default function AppTemplate({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      // min-h-full (not h-full): lets content grow past the viewport so
      // overflow-y-auto on the parent correctly enables scrolling.
      // h-full clamps to the content-box height and can suppress scroll in iOS Safari.
      className="min-h-full"
    >
      {children}
    </motion.div>
  );
}
