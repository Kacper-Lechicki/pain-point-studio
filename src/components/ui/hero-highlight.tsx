'use client';

import React from 'react';

import { motion, useMotionTemplate, useMotionValue } from 'motion/react';

import { cn } from '@/lib/common/utils';

const getEncodedPattern = (color: string) => {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='16' height='24' fill='none'><circle fill='${color}' id='pattern-circle' cx='10' cy='10' r='2.5'></circle></svg>`;

  const base64 = btoa(svg);

  return `url("data:image/svg+xml;base64,${base64}")`;
};

const getComputedColor = (cssVar: string): string => {
  if (typeof window === 'undefined') {
    return '#d4d4d4';
  }

  const style = getComputedStyle(document.documentElement);

  return style.getPropertyValue(cssVar).trim() || '#d4d4d4';
};

type HeroHighlightProps = {
  children: React.ReactNode;
  className?: string;
  containerClassName?: string;
  navbar?: React.ReactNode;
  showDotsOnMobile?: boolean;
};

export const HeroHighlight = ({
  children,
  className,
  containerClassName,
  navbar,
  showDotsOnMobile = true,
}: HeroHighlightProps) => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const dotPatterns = React.useMemo(() => {
    if (!mounted) {
      return { default: '', hover: '' };
    }

    return {
      default: getEncodedPattern(getComputedColor('--dot-default')),
      hover: getEncodedPattern(getComputedColor('--dot-hover')),
    };
  }, [mounted]);

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
        className={cn(
          'pointer-events-none absolute inset-0 mask-[radial-gradient(ellipse_at_center,black,transparent_100%)] sm:mask-[radial-gradient(ellipse_at_center,black,transparent_80%)]',
          !showDotsOnMobile && 'max-lg:hidden!'
        )}
        style={{
          backgroundImage: dotPatterns.default,
        }}
      />

      <motion.div
        className={cn(
          'pointer-events-none absolute inset-0 mask-[radial-gradient(ellipse_at_center,black,transparent_80%)] opacity-0 transition duration-300 md:group-hover:opacity-100',
          !showDotsOnMobile && 'max-lg:hidden!'
        )}
        style={{
          backgroundImage: dotPatterns.hover,
          WebkitMaskImage: useMotionTemplate`
            radial-gradient(
              180px circle at ${mouseX}px ${mouseY}px,
              black 60%,
              transparent 100%
            ),
            radial-gradient(ellipse at center, black, transparent 80%)
          `,
          maskImage: useMotionTemplate`
            radial-gradient(
              180px circle at ${mouseX}px ${mouseY}px,
              black 60%,
              transparent 100%
            ),
            radial-gradient(ellipse at center, black, transparent 80%)
          `,
          maskComposite: 'intersect',
          WebkitMaskComposite: 'source-in',
        }}
      />

      <div className={cn('relative z-20', className)}>{children}</div>

      {navbar != null ? <div className="relative z-50">{navbar}</div> : null}
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
        `relative inline-block md:rounded-lg md:bg-linear-to-r md:from-blue-200 md:to-blue-300 md:px-1 md:pb-1 md:dark:from-blue-500/50 md:dark:to-blue-600/50`,
        className
      )}
    >
      {children}
    </motion.span>
  );
};
