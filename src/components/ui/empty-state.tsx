import type { ReactNode } from 'react';

import type { LucideIcon } from 'lucide-react';

import { HeroHighlight } from '@/components/ui/hero-highlight';
import { cn } from '@/lib/common/utils';

type EmptyStateAccent = 'violet' | 'cyan' | 'emerald' | 'pink' | 'primary';
type EmptyStateVariant = 'page' | 'card' | 'inline';

const ACCENT_ICON_COLOR: Record<EmptyStateAccent, string> = {
  violet: 'text-chart-violet/70',
  cyan: 'text-chart-cyan/70',
  emerald: 'text-chart-emerald/70',
  pink: 'text-chart-pink/70',
  primary: 'text-primary/70',
};

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
  variant?: EmptyStateVariant;
  accent?: EmptyStateAccent;
  className?: string;
}

const EmptyState = ({
  icon: Icon,
  title,
  description,
  action,
  variant = 'page',
  accent,
  className,
}: EmptyStateProps) => {
  const iconColor = accent ? ACCENT_ICON_COLOR[accent] : 'text-muted-foreground';

  const content = (
    <div
      className={cn(
        'flex w-full flex-col items-center text-center',
        variant === 'page' && 'px-8 py-16 sm:px-10 md:py-20',
        variant === 'card' && 'px-4 py-6',
        variant === 'inline' && 'px-2 py-4',
        className
      )}
    >
      {variant === 'inline' ? (
        <Icon className={cn('mb-1.5 size-5', iconColor)} aria-hidden />
      ) : (
        <div
          className={cn(
            'bg-muted mb-4 flex items-center justify-center',
            variant === 'page' && 'size-12 rounded-xl',
            variant === 'card' && 'size-9 rounded-lg'
          )}
        >
          <Icon
            className={cn(
              iconColor,
              variant === 'page' && 'size-6',
              variant === 'card' && 'size-[18px]'
            )}
            aria-hidden
          />
        </div>
      )}

      <h3
        className={cn(
          'font-semibold',
          variant === 'page' && 'text-base',
          (variant === 'card' || variant === 'inline') && 'text-sm'
        )}
      >
        {title}
      </h3>

      <p
        className={cn(
          'text-muted-foreground mt-1.5 leading-relaxed',
          variant === 'page' && 'max-w-sm text-sm',
          variant === 'card' && 'max-w-xs text-xs',
          variant === 'inline' && 'text-xs'
        )}
      >
        {description}
      </p>

      {action && (
        <div
          className={cn(
            variant === 'page' && 'mt-6',
            variant === 'card' && 'mt-3',
            variant === 'inline' && 'mt-2.5'
          )}
        >
          {action}
        </div>
      )}
    </div>
  );

  if (variant === 'page') {
    return (
      <HeroHighlight
        showDotsOnMobile={false}
        containerClassName="w-full md:rounded-lg md:border md:border-dashed md:border-border"
      >
        {content}
      </HeroHighlight>
    );
  }

  return content;
};

export { EmptyState };
export type { EmptyStateAccent, EmptyStateVariant };
