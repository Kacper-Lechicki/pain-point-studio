import type { ReactNode } from 'react';

import { DASHBOARD_CONTENT_MAX_WIDTH } from '@/features/dashboard/config/layout';
import { cn } from '@/lib/common/utils';

const MAX_WIDTH_CLASSES: Record<NonNullable<DashboardContentAreaProps['maxWidth']>, string> = {
  narrow: 'max-w-4xl',
  content: DASHBOARD_CONTENT_MAX_WIDTH,
  full: '',
};

interface DashboardContentAreaProps {
  children: ReactNode;
  maxWidth?: 'narrow' | 'content' | 'full';
  className?: string;
}

function DashboardContentArea({
  children,
  maxWidth = 'content',
  className,
}: DashboardContentAreaProps) {
  return (
    <div
      className={cn(
        'px-4 pt-4 pb-12 sm:px-6 lg:px-8',
        MAX_WIDTH_CLASSES[maxWidth],
        'mx-auto w-full',
        className
      )}
    >
      {children}
    </div>
  );
}

export { DashboardContentArea };
