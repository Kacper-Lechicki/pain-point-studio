'use client';

import React from 'react';

import { motion, useMotionTemplate, useMotionValue } from 'motion/react';

import { cn } from '@/lib/utils';

const getEncodedPattern = (color: string) => {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='16' height='24' fill='none'><circle fill='${color}' id='pattern-circle' cx='10' cy='10' r='2.5'></circle></svg>`;
  const base64 = typeof btoa !== 'undefined' ? btoa(svg) : Buffer.from(svg).toString('base64');

  return `url("data:image/svg+xml;base64,${base64}")`;
};

type HeroHighlightProps = {
  children: React.ReactNode;
  className?: string;
  containerClassName?: string;
};

export const HeroHighlight = ({ children, className, containerClassName }: HeroHighlightProps) => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const dotPatterns = {
    light: {
      default: getEncodedPattern('#d4d4d4'),
      hover: getEncodedPattern('#3b82f6'),
    },
    dark: {
      default: getEncodedPattern('#404040'),
      hover: getEncodedPattern('#60a5fa'),
    },
  };

  const handleMouseMove = ({
    currentTarget,
    clientX,
    clientY,
  }: React.MouseEvent<HTMLDivElement>) => {
    if (!currentTarget) {
      return;
    }

    const { left, top } = currentTarget.getBoundingClientRect();

    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  };

  return (
    <div
      className={cn('group relative flex w-full items-center justify-center', containerClassName)}
      onMouseMove={handleMouseMove}
    >
      <div
        className="pointer-events-none absolute inset-0 mask-[radial-gradient(ellipse_at_center,black,transparent_65%)] dark:hidden"
        style={{
          backgroundImage: dotPatterns.light.default,
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 hidden mask-[radial-gradient(ellipse_at_center,black,transparent_65%)] dark:block"
        style={{
          backgroundImage: dotPatterns.dark.default,
        }}
      />
      <motion.div
        className="pointer-events-none absolute inset-0 mask-[radial-gradient(ellipse_at_center,black,transparent_65%)] opacity-0 transition duration-300 group-hover:opacity-100 dark:hidden"
        style={{
          backgroundImage: dotPatterns.light.hover,
          WebkitMaskImage: useMotionTemplate`
            radial-gradient(
              200px circle at ${mouseX}px ${mouseY}px,
              black 0%,
              transparent 100%
            ),
            radial-gradient(ellipse at center, black, transparent 65%)
          `,
          maskImage: useMotionTemplate`
            radial-gradient(
              200px circle at ${mouseX}px ${mouseY}px,
              black 0%,
              transparent 100%
            ),
            radial-gradient(ellipse at center, black, transparent 65%)
          `,
          maskComposite: 'intersect',
          WebkitMaskComposite: 'source-in',
        }}
      />
      <motion.div
        className="pointer-events-none absolute inset-0 hidden mask-[radial-gradient(ellipse_at_center,black,transparent_65%)] opacity-0 transition duration-300 group-hover:opacity-100 dark:block"
        style={{
          backgroundImage: dotPatterns.dark.hover,
          WebkitMaskImage: useMotionTemplate`
            radial-gradient(
              200px circle at ${mouseX}px ${mouseY}px,
              black 0%,
              transparent 100%
            ),
            radial-gradient(ellipse at center, black, transparent 65%)
          `,
          maskImage: useMotionTemplate`
            radial-gradient(
              200px circle at ${mouseX}px ${mouseY}px,
              black 0%,
              transparent 100%
            ),
            radial-gradient(ellipse at center, black, transparent 65%)
          `,
          maskComposite: 'intersect',
          WebkitMaskComposite: 'source-in',
        }}
      />

      <div className={cn('relative z-20', className)}>{children}</div>
    </div>
  );
};

type HighlightProps = {
  children: React.ReactNode;
  className?: string;
};

export const Highlight = ({ children, className }: HighlightProps) => {
  return (
    <motion.span
      initial={{
        backgroundSize: '0% 100%',
      }}
      animate={{
        backgroundSize: '100% 100%',
      }}
      transition={{
        duration: 2,
        ease: 'linear',
        delay: 0.5,
      }}
      style={{
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'left center',
        display: 'inline',
      }}
      className={cn(
        `relative inline-block rounded-lg bg-linear-to-r from-blue-200 to-blue-300 px-1 pb-1 dark:from-blue-500/50 dark:to-blue-600/50`,
        className
      )}
    >
      {children}
    </motion.span>
  );
};
