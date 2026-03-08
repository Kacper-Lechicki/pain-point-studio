import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';

import { TableHead } from '@/components/ui/table';
import { cn } from '@/lib/common/utils';

interface SortableTableHeaderProps<T extends string> {
  sortKey: T;
  currentSortKey: T;
  sortDir: 'asc' | 'desc';
  onSort: (key: T) => void;
  label: string;
  className?: string;
  centered?: boolean;
}

export function SortableTableHeader<T extends string>({
  sortKey,
  currentSortKey,
  sortDir,
  onSort,
  label,
  className,
  centered = false,
}: SortableTableHeaderProps<T>) {
  const isActive = currentSortKey === sortKey;

  return (
    <TableHead className={cn('pr-3', centered && 'text-center', className)}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={cn(
          'gap-1 font-medium whitespace-nowrap md:hover:opacity-80',
          centered ? 'inline-flex items-center justify-center' : 'flex items-center'
        )}
      >
        {label}
        {isActive ? (
          sortDir === 'asc' ? (
            <ArrowUp className="size-3.5" aria-hidden />
          ) : (
            <ArrowDown className="size-3.5" aria-hidden />
          )
        ) : (
          <ArrowUpDown className="text-muted-foreground size-3.5" aria-hidden />
        )}
      </button>
    </TableHead>
  );
}
