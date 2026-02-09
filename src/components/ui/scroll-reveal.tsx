'use client';

import { type ReactNode, memo, useEffect, useRef, useState } from 'react';

import { cn } from '@/lib/common/utils';

type ScrollRevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  width?: 'fit-content' | '100%';
};

export const ScrollReveal = memo(
  ({ children, className, delay = 0, duration = 0.5, width = '100%' }: ScrollRevealProps) => {
    const ref = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
      const element = ref.current;

      if (!element) {
        return;
      }

      const observer = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];

          if (entry?.isIntersecting) {
            setIsVisible(true);
            observer.unobserve(element);
          }
        },
        { rootMargin: '-80px', threshold: 0.1 }
      );

      observer.observe(element);

      return () => {
        observer.unobserve(element);
      };
    }, []);

    return (
      <div
        ref={ref}
        style={{
          width,
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateY(0px)' : 'translateY(40px)',
          transition: `opacity ${duration}s ease-out ${delay}s, transform ${duration}s ease-out ${delay}s`,
          willChange: isVisible ? 'auto' : 'transform, opacity',
        }}
        className={cn(
          'motion-reduce:transform-none! motion-reduce:opacity-100! motion-reduce:transition-none!',
          className
        )}
      >
        {children}
      </div>
    );
  }
);

ScrollReveal.displayName = 'ScrollReveal';
