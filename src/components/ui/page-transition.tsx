import { type ReactNode } from 'react';

import { cn } from '@/lib/common/utils';

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

const PageTransition = ({ children, className }: PageTransitionProps) => {
  return (
    <div
      className={cn(
        'animate-[page-fade-in_0.2s_cubic-bezier(0.25,0.1,0.25,1)_both] motion-reduce:animate-none',
        className
      )}
    >
      {children}
    </div>
  );
};

export { PageTransition };
