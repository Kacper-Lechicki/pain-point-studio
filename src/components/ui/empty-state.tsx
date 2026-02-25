import type { ReactNode } from 'react';

import type { LucideIcon } from 'lucide-react';

import { HeroHighlight } from '@/components/ui/hero-highlight';
import { cn } from '@/lib/common/utils';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
  variant?: 'default' | 'compact';
}

const EmptyState = ({
  icon: Icon,
  title,
  description,
  action,
  variant = 'default',
}: EmptyStateProps) => {
  const isCompact = variant === 'compact';

  const content = (
    <div
      className={cn(
        'flex w-full flex-col items-center text-center',
        isCompact ? 'px-2 py-4' : 'px-8 py-16 sm:px-10 md:py-20'
      )}
    >
      <div
        className={cn(
          'text-muted-foreground flex items-center justify-center',
          isCompact ? 'mb-2 size-6' : 'mb-4 size-10'
        )}
      >
        <Icon className={isCompact ? 'size-6' : 'size-10'} aria-hidden />
      </div>

      <h3 className={cn('font-semibold', isCompact ? 'text-sm' : 'text-base')}>{title}</h3>

      <p
        className={cn(
          'text-muted-foreground mt-1.5 max-w-sm leading-relaxed',
          isCompact ? 'text-xs' : 'text-sm'
        )}
      >
        {description}
      </p>

      {action && <div className={isCompact ? 'mt-3' : 'mt-6'}>{action}</div>}
    </div>
  );

  if (isCompact) {
    return content;
  }

  return (
    <HeroHighlight
      showDotsOnMobile={false}
      containerClassName="w-full md:rounded-lg md:border md:border-dashed md:border-border"
    >
      {content}
    </HeroHighlight>
  );
};

export { EmptyState };
