'use client';

import { memo, useEffect, useRef, useState, useSyncExternalStore } from 'react';

import { cn } from '@/lib/utils';

type Dimensions = {
  width: number;
  height: number;
};

type PointerHighlightProps = {
  children: React.ReactNode;
  active?: boolean;
  rectangleClassName?: string;
  pointerClassName?: string;
  containerClassName?: string;
};

export const PointerHighlight = memo(function PointerHighlight({
  children,
  active = false,
  rectangleClassName,
  pointerClassName,
  containerClassName,
}: PointerHighlightProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState<Dimensions>({ width: 0, height: 0 });
  const prefersReducedMotion = useSyncExternalStore(
    (callback) => {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      mediaQuery.addEventListener('change', callback);

      return () => mediaQuery.removeEventListener('change', callback);
    },
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    () => false
  );

  useEffect(() => {
    const container = containerRef.current;

    const resizeObserver = new ResizeObserver((entries: ResizeObserverEntry[]) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setDimensions({ width, height });
      }
    });

    if (container) {
      resizeObserver.observe(container);
    }

    return () => {
      if (container) {
        resizeObserver.unobserve(container);
      }
    };
  }, []);

  const hasValidDimensions = dimensions.width > 0 && dimensions.height > 0;
  const duration = prefersReducedMotion ? 0 : 0.3;

  return (
    <div className={cn('relative w-fit', containerClassName)} ref={containerRef}>
      {children}

      {hasValidDimensions && (
        <div className="pointer-events-none absolute inset-0 hidden md:block">
          <div
            className={cn(
              'absolute origin-top-left rounded-lg border border-neutral-800 dark:border-neutral-200',
              rectangleClassName
            )}
            style={{
              width: dimensions.width,
              height: dimensions.height,
              transform: active ? 'scale(1)' : 'scale(0)',
              opacity: active ? 1 : 0,
              transition: `transform ${duration}s cubic-bezier(0.25, 0.1, 0.25, 1), opacity ${duration}s cubic-bezier(0.25, 0.1, 0.25, 1)`,
            }}
          />

          <div
            className="absolute top-0 left-0"
            style={{
              transform: active
                ? `translate(${dimensions.width}px, ${dimensions.height}px) rotate(-90deg)`
                : 'translate(0px, 0px) rotate(-90deg)',
              opacity: active ? 1 : 0,
              transition: `transform ${duration}s cubic-bezier(0.25, 0.1, 0.25, 1), opacity ${duration}s cubic-bezier(0.25, 0.1, 0.25, 1)`,
            }}
          >
            <Pointer className={cn('text-primary h-5 w-5', pointerClassName)} aria-hidden="true" />
          </div>
        </div>
      )}
    </div>
  );
});

type PointerProps = React.SVGProps<SVGSVGElement>;

const Pointer = memo(({ ...props }: PointerProps) => {
  return (
    <svg
      stroke="currentColor"
      fill="currentColor"
      strokeWidth="1"
      strokeLinecap="round"
      strokeLinejoin="round"
      viewBox="0 0 16 16"
      height="1em"
      width="1em"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="M14.082 2.182a.5.5 0 0 1 .103.557L8.528 15.467a.5.5 0 0 1-.917-.007L5.57 10.694.803 8.652a.5.5 0 0 1-.006-.916l12.728-5.657a.5.5 0 0 1 .556.103z"></path>
    </svg>
  );
});

Pointer.displayName = 'Pointer';
