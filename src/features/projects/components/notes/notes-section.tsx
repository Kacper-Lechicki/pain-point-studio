'use client';

import { type MouseEvent, type ReactNode, useCallback, useState } from 'react';

import { ChevronRight } from 'lucide-react';

import { cn } from '@/lib/common/utils';

interface NotesSectionProps {
  title: string;
  count?: number;
  children: ReactNode;
  defaultExpanded?: boolean;
  collapsible?: boolean;
  action?: ReactNode;
}

export function NotesSection({
  title,
  count,
  children,
  defaultExpanded = true,
  collapsible = true,
  action,
}: NotesSectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const toggleExpanded = useCallback(() => {
    if (collapsible) {
      setExpanded((prev) => !prev);
    }
  }, [collapsible]);

  // Prevent collapse when clicking the action button
  const handleActionClick = useCallback((e: MouseEvent) => {
    e.stopPropagation();
  }, []);

  return (
    <div className="py-1">
      <button
        type="button"
        onClick={toggleExpanded}
        className={cn(
          'flex w-full items-center gap-1 px-2.5 py-1 text-xs font-medium',
          'text-muted-foreground hover:text-foreground transition-colors',
          !collapsible && 'cursor-default'
        )}
      >
        {collapsible && (
          <ChevronRight className={cn('size-3 transition-transform', expanded && 'rotate-90')} />
        )}
        <span className="tracking-wide uppercase">{title}</span>
        {count !== undefined && count > 0 && (
          <span className="text-muted-foreground/70 tabular-nums">({count})</span>
        )}
        <div className="flex-1" />
        {action && <div onClick={handleActionClick}>{action}</div>}
      </button>

      {expanded && <div className="mt-0.5">{children}</div>}
    </div>
  );
}
