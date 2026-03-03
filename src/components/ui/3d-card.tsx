'use client';

import React, { createContext, memo, useCallback, useContext, useRef, useState } from 'react';

import { BREAKPOINTS } from '@/config';
import { cn } from '@/lib/common/utils';

type MouseEnterContextValue = [boolean, React.Dispatch<React.SetStateAction<boolean>>];

const MouseEnterContext = createContext<MouseEnterContextValue | undefined>(undefined);

interface CardContainerProps {
  children?: React.ReactNode;
  className?: string;
  containerClassName?: string;
}

export const CardContainer = memo(
  ({ children, className, containerClassName }: CardContainerProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isMouseEntered, setIsMouseEntered] = useState(false);
    const rafRef = useRef<number | null>(null);

    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
      if (
        !containerRef.current ||
        typeof window === 'undefined' ||
        window.innerWidth < BREAKPOINTS.md
      ) {
        return;
      }

      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }

      rafRef.current = requestAnimationFrame(() => {
        if (!containerRef.current) {
          return;
        }

        const { left, top, width, height } = containerRef.current.getBoundingClientRect();
        const x = (e.clientX - left - width / 2) / 25;
        const y = (e.clientY - top - height / 2) / 25;

        containerRef.current.style.transform = `rotateY(${x}deg) rotateX(${y}deg)`;
      });
    }, []);

    const handleMouseEnter = useCallback(() => {
      if (typeof window === 'undefined' || window.innerWidth < BREAKPOINTS.md) {
        return;
      }

      setIsMouseEntered(true);
    }, []);

    const handleMouseLeave = useCallback(() => {
      if (!containerRef.current) {
        return;
      }

      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }

      setIsMouseEntered(false);

      containerRef.current.style.transform = `rotateY(0deg) rotateX(0deg)`;
    }, []);

    return (
      <MouseEnterContext.Provider value={[isMouseEntered, setIsMouseEntered]}>
        <div
          className={cn('flex items-center justify-center py-20', containerClassName)}
          style={{ perspective: '1000px' }}
        >
          <div
            ref={containerRef}
            onMouseEnter={handleMouseEnter}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className={cn(
              'relative flex transform-gpu items-center justify-center',
              'transition-transform duration-200 ease-linear',
              className
            )}
            style={{
              transformStyle: 'preserve-3d',
              willChange: isMouseEntered ? 'transform' : 'auto',
            }}
          >
            {children}
          </div>
        </div>
      </MouseEnterContext.Provider>
    );
  }
);

CardContainer.displayName = 'CardContainer';

interface CardBodyProps {
  children: React.ReactNode;
  className?: string;
}

export const CardBody = memo(({ children, className }: CardBodyProps) => {
  return <div className={cn('transform-3d *:transform-3d', className)}>{children}</div>;
});

CardBody.displayName = 'CardBody';

type TransformValue = number | string;

interface CardItemProps {
  as?: React.ElementType;
  children: React.ReactNode;
  className?: string;
  translateX?: TransformValue;
  translateY?: TransformValue;
  translateZ?: TransformValue;
  rotateX?: TransformValue;
  rotateY?: TransformValue;
  rotateZ?: TransformValue;
  [key: string]: unknown;
}

export const CardItem = memo(
  ({
    as: Tag = 'div',
    children,
    className,
    translateX = 0,
    translateY = 0,
    translateZ = 0,
    rotateX = 0,
    rotateY = 0,
    rotateZ = 0,
    ...rest
  }: CardItemProps) => {
    const ref = useRef<HTMLDivElement>(null);
    const [isMouseEntered] = useMouseEnter();

    const transform = isMouseEntered
      ? `translateX(${translateX}px) translateY(${translateY}px) translateZ(${translateZ}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg)`
      : 'translateX(0px) translateY(0px) translateZ(0px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)';

    return (
      <Tag
        ref={ref}
        className={cn(
          'w-fit transform-gpu transition-transform duration-200 ease-linear',
          className
        )}
        style={{
          transform,
          willChange: isMouseEntered ? 'transform' : 'auto',
        }}
        {...rest}
      >
        {children}
      </Tag>
    );
  }
);

CardItem.displayName = 'CardItem';

const useMouseEnter = () => {
  const context = useContext(MouseEnterContext);

  if (context === undefined) {
    throw new Error('useMouseEnter must be used within a MouseEnterProvider');
  }

  return context;
};
