'use client';

import type { ReactNode } from 'react';

import { motion } from 'motion/react';

type ScrollRevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  width?: 'fit-content' | '100%';
};

export const ScrollReveal = ({
  children,
  className,
  delay = 0,
  duration = 0.5,
  width = '100%',
}: ScrollRevealProps) => {
  return (
    <div style={{ width }} className={className}>
      <motion.div
        variants={{
          hidden: { opacity: 0, y: 75 },
          visible: { opacity: 1, y: 0 },
        }}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-200px' }}
        transition={{ duration, delay, ease: 'easeOut' }}
      >
        {children}
      </motion.div>
    </div>
  );
};
