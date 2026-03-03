'use client';

import type { ReactNode } from 'react';

import { Filter, X } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { SearchInput } from '@/components/ui/search-input';
import { Separator } from '@/components/ui/separator';
import { SortDropdown } from '@/components/ui/sort-dropdown';
import { cn } from '@/lib/common/utils';

// ── Types ────────────────────────────────────────────────────────────

export interface FilterOption {
  value: string;
  label: string;
  count?: number;
  /** Optional class for the label text (e.g. italic for sentinel values). */
  labelClassName?: string;
}

export interface FilterGroup {
  /** Section heading label. */
  label: string;
  /** Checkbox options to display. */
  options: FilterOption[];
  /** Currently selected values. */
  selected: string[];
  /** Called when selection changes. */
  onChange: (selected: string[]) => void;
}

interface ListToolbarProps<TSortBy extends string> {
  // Search
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  searchPlaceholder: string;

  // Filters (optional — some lists like the archive list have no filters)
  filterGroups?: FilterGroup[];
  filterLabel?: string;
  clearFiltersLabel?: string;

  // Sort
  sortBy: TSortBy;
  sortDir: 'asc' | 'desc';
  onSortByChange: (sort: TSortBy) => void;
  onSortDirChange: (dir: 'asc' | 'desc') => void;
  sortOptions: { value: TSortBy; label: string }[];
  sortDirLabels: { asc: string; desc: string };
  sortLabel: string;

  // Extra content (e.g. action buttons)
  actions?: ReactNode;

  className?: string;
}

// ── Constants ────────────────────────────────────────────────────────

const FILTER_ITEM_CLASS =
  'flex cursor-pointer items-center gap-2 rounded-lg border border-transparent px-2 py-1.5 text-sm outline-hidden transition-colors select-none hover:border-dashed hover:border-foreground/30 hover:text-foreground';

// ── Component ────────────────────────────────────────────────────────

export function ListToolbar<TSortBy extends string>({
  searchQuery,
  onSearchQueryChange,
  searchPlaceholder,
  filterGroups,
  filterLabel,
  clearFiltersLabel,
  sortBy,
  sortDir,
  onSortByChange,
  onSortDirChange,
  sortOptions,
  sortDirLabels,
  sortLabel,
  actions,
  className,
}: ListToolbarProps<TSortBy>) {
  const activeFilterCount =
    filterGroups?.reduce((sum, group) => sum + group.selected.length, 0) ?? 0;
  const isFiltered = activeFilterCount > 0;
  const hasFilters = filterGroups && filterGroups.length > 0;

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      <SearchInput
        value={searchQuery}
        onChange={onSearchQueryChange}
        placeholder={searchPlaceholder}
        className="basis-full sm:max-w-sm sm:flex-1 sm:basis-auto"
      />

      {hasFilters && (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={isFiltered ? 'secondary' : 'outline'}
              className={cn('ml-auto shrink-0 gap-1.5', isFiltered && 'pr-2')}
            >
              <Filter className="size-4" />
              {filterLabel && <span className="hidden sm:inline">{filterLabel}</span>}

              {isFiltered && (
                <Badge variant="secondary" className="ml-0.5 size-5 px-0 text-[10px]">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>

          <PopoverContent align="end" className="w-56 p-0">
            {filterGroups.map((group, groupIndex) => {
              if (group.options.length === 0) {
                return null;
              }

              return (
                <div key={group.label}>
                  {groupIndex > 0 && <Separator />}

                  <div className="p-2">
                    <p className="text-muted-foreground mb-1 px-2 text-xs font-medium">
                      {group.label}
                    </p>

                    <div className="flex flex-col">
                      {group.options.map((opt) => (
                        <label key={opt.value} className={FILTER_ITEM_CLASS}>
                          <Checkbox
                            checked={group.selected.includes(opt.value)}
                            onCheckedChange={() => {
                              if (group.selected.includes(opt.value)) {
                                group.onChange(group.selected.filter((v) => v !== opt.value));
                              } else {
                                group.onChange([...group.selected, opt.value]);
                              }
                            }}
                          />

                          <span className={cn('min-w-0 flex-1 truncate', opt.labelClassName)}>
                            {opt.label}
                          </span>

                          {opt.count !== undefined && (
                            <span className="text-muted-foreground text-xs tabular-nums">
                              {opt.count}
                            </span>
                          )}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}

            {isFiltered && (
              <>
                <Separator />

                <div className="p-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      for (const group of filterGroups) {
                        group.onChange([]);
                      }
                    }}
                    className="w-full gap-1.5 text-xs"
                  >
                    <X className="size-3" />
                    {clearFiltersLabel}
                  </Button>
                </div>
              </>
            )}
          </PopoverContent>
        </Popover>
      )}

      <SortDropdown
        sortBy={sortBy}
        onSortByChange={onSortByChange}
        options={sortOptions}
        sortDir={sortDir}
        onSortDirChange={onSortDirChange}
        dirLabels={sortDirLabels}
        sortLabel={sortLabel}
      />

      {actions}
    </div>
  );
}
