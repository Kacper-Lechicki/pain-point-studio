import { ArrowDown, ArrowUp } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/common/utils';

interface SortDropdownProps<T extends string> {
  sortBy: T;
  onSortByChange: (value: T) => void;
  options: { value: T; label: string }[];
  sortDir?: 'asc' | 'desc';
  onSortDirChange?: (dir: 'asc' | 'desc') => void;
  dirLabels?: { asc: string; desc: string };
  sortLabel?: string;
  size?: 'default' | 'sm';
  className?: string;
}

export function SortDropdown<T extends string>({
  sortBy,
  onSortByChange,
  options,
  sortDir,
  onSortDirChange,
  dirLabels,
  sortLabel,
  size = 'default',
  className,
}: SortDropdownProps<T>) {
  const iconClass = size === 'sm' ? 'size-3.5' : 'size-4';
  const showDirToggle = sortDir != null && onSortDirChange != null && dirLabels != null;
  const isAsc = sortDir === 'asc';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size={size === 'sm' ? 'sm' : undefined}
          className={cn('shrink-0 gap-1.5', size === 'sm' && 'text-xs', className)}
        >
          {isAsc ? (
            <ArrowUp className={iconClass} aria-hidden />
          ) : (
            <ArrowDown className={iconClass} aria-hidden />
          )}
          {sortLabel && <span className="hidden sm:inline">{sortLabel}</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-40">
        <DropdownMenuRadioGroup value={sortBy} onValueChange={(v) => onSortByChange(v as T)}>
          {options.map((option) => (
            <DropdownMenuRadioItem key={option.value} value={option.value}>
              {option.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
        {showDirToggle && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
                onSortDirChange(isAsc ? 'desc' : 'asc');
              }}
            >
              {isAsc ? (
                <ArrowUp className={iconClass} aria-hidden />
              ) : (
                <ArrowDown className={iconClass} aria-hidden />
              )}
              {isAsc ? dirLabels.asc : dirLabels.desc}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
