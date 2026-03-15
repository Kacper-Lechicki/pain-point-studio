'use client';

import React from 'react';

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
  const [mounted, setMounted] = React.useState(false);
  const [mousePos, setMousePos] = React.useState<{ x: number; y: number } | null>(null);

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

  const rafRef = React.useRef<number>(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!e.currentTarget) {
      return;
    }

    const { left, top } = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - left;
    const y = e.clientY - top;

    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      setMousePos({ x, y });
    });
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

      {mousePos && (
        <div
          className={cn(
            'pointer-events-none absolute inset-0 mask-[radial-gradient(ellipse_at_center,black,transparent_80%)] opacity-0 transition duration-300 md:group-hover:opacity-100',
            !showDotsOnMobile && 'max-lg:hidden!'
          )}
          style={{
            backgroundImage: dotPatterns.hover,
            WebkitMaskImage: `
              radial-gradient(
                180px circle at ${mousePos.x}px ${mousePos.y}px,
                black 60%,
                transparent 100%
              ),
              radial-gradient(ellipse at center, black, transparent 80%)
            `,
            maskImage: `
              radial-gradient(
                180px circle at ${mousePos.x}px ${mousePos.y}px,
                black 60%,
                transparent 100%
              ),
              radial-gradient(ellipse at center, black, transparent 80%)
            `,
            maskComposite: 'intersect',
            WebkitMaskComposite: 'source-in',
          }}
        />
      )}

      <div className={cn('relative z-20', className)}>{children}</div>

      {navbar != null ? <div className="relative z-50">{navbar}</div> : null}
    </div>
  );
};
