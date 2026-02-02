'use client';

import { useEffect, useRef, useState } from 'react';

import { motion } from 'motion/react';

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

export function PointerHighlight({
  children,
  active = false,
  rectangleClassName,
  pointerClassName,
  containerClassName,
}: PointerHighlightProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState<Dimensions>({ width: 0, height: 0 });

  useEffect(() => {
    const container = containerRef.current;

    if (container) {
      const { width, height } = container.getBoundingClientRect();
      setDimensions({ width, height });
    }

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

  return (
    <div className={cn('relative w-fit', containerClassName)} ref={containerRef}>
      {children}

      {hasValidDimensions && (
        <div className="pointer-events-none absolute inset-0">
          <motion.div
            className={cn(
              'absolute inset-0 rounded-lg border border-neutral-800 dark:border-neutral-200',
              rectangleClassName
            )}
            initial={{ width: 0, height: 0, opacity: 0 }}
            animate={
              active
                ? { width: dimensions.width, height: dimensions.height, opacity: 1 }
                : { width: 0, height: 0, opacity: 0 }
            }
            transition={{
              duration: 0.4,
              ease: 'easeInOut',
            }}
          />
          <motion.div
            className="absolute top-0 left-0"
            initial={{ opacity: 0, x: 0, y: 0 }}
            animate={
              active
                ? { opacity: 1, x: dimensions.width, y: dimensions.height }
                : { opacity: 0, x: 0, y: 0 }
            }
            style={{ rotate: -90 }}
            transition={{
              duration: 0.4,
              ease: 'easeInOut',
            }}
          >
            <Pointer className={cn('text-primary h-5 w-5', pointerClassName)} aria-hidden="true" />
          </motion.div>
        </div>
      )}
    </div>
  );
}

type PointerProps = React.SVGProps<SVGSVGElement>;

const Pointer = ({ ...props }: PointerProps) => {
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
};
