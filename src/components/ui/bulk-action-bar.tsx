'use client';

import type { LucideIcon } from 'lucide-react';
import { CheckSquare, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/common/utils';

export interface BulkActionDescriptor {
  key: string;
  icon: LucideIcon;
  label: string;
  colorClassName: string;
}

interface BulkActionBarProps {
  count: number;
  actions: BulkActionDescriptor[];
  onAction: (actionKey: string) => void;
  onClear: () => void;
  onSelectAll?: (() => void) | undefined;
  allOnPageSelected?: boolean | undefined;
  selectAllLabel: string;
  clearSelectionLabel: string;
}

export function BulkActionBar({
  count,
  actions,
  onAction,
  onClear,
  onSelectAll,
  allOnPageSelected,
  selectAllLabel,
  clearSelectionLabel,
}: BulkActionBarProps) {
  if (count === 0) {
    return null;
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 flex justify-center p-2 md:p-4">
      <div
        className={cn(
          'bg-popover/95 border-border shadow-lg backdrop-blur-sm',
          'inline-flex max-w-full items-center gap-1.5 rounded-xl border px-2.5 py-2',
          'md:gap-3 md:px-4'
        )}
      >
        <span className="bg-primary text-primary-foreground inline-flex h-6 shrink-0 items-center rounded-md px-2 text-xs font-semibold tabular-nums">
          {count}
        </span>

        {onSelectAll && !allOnPageSelected && (
          <Button
            variant="ghost"
            size="icon-xs"
            className="text-muted-foreground shrink-0 md:hidden"
            onClick={onSelectAll}
            aria-label={selectAllLabel}
          >
            <CheckSquare className="size-3.5" aria-hidden />
          </Button>
        )}

        {actions.length > 0 && (
          <>
            <div className="bg-border h-5 w-px shrink-0" />

            <div className="flex items-center gap-1 overflow-x-auto md:gap-1.5">
              {actions.map((desc) => {
                const Icon = desc.icon;

                return (
                  <Button
                    key={desc.key}
                    size="sm"
                    variant="outline"
                    className={cn(
                      'h-8 shrink-0 gap-1.5 bg-transparent px-2.5 text-xs font-medium shadow-none',
                      'md:px-3',
                      desc.colorClassName
                    )}
                    onClick={() => onAction(desc.key)}
                  >
                    <Icon className="size-3.5 shrink-0" aria-hidden />
                    {desc.label}
                  </Button>
                );
              })}
            </div>
          </>
        )}

        <div className="bg-border h-5 w-px shrink-0" />

        <Button
          variant="ghost"
          size="icon-xs"
          className="text-muted-foreground md:hover:text-foreground shrink-0"
          onClick={onClear}
          aria-label={clearSelectionLabel}
        >
          <X className="size-3.5" aria-hidden />
        </Button>
      </div>
    </div>
  );
}
