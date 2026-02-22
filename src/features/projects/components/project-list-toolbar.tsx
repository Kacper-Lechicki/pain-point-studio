'use client';

import { Filter, X } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { SearchInput } from '@/components/ui/search-input';
import { Separator } from '@/components/ui/separator';
import { SortDropdown } from '@/components/ui/sort-dropdown';
import { PROJECT_CONTEXTS_CONFIG } from '@/features/projects/config/contexts';
import { PROJECT_CONTEXTS } from '@/features/projects/types';
import type { MessageKey } from '@/i18n/types';
import { sortOptionsAlphabetically } from '@/lib/common/sort-options';
import { cn } from '@/lib/common/utils';

export type ProjectStatusFilter = 'active' | 'archived';
export type ProjectSortBy =
  | 'updated'
  | 'created'
  | 'name'
  | 'surveys'
  | 'responses'
  | 'status'
  | 'context'
  | 'progress';

const STATUS_OPTIONS: ProjectStatusFilter[] = ['active', 'archived'];

const SORT_OPTIONS: ProjectSortBy[] = ['name', 'surveys', 'responses', 'updated', 'created'];

const FILTER_ITEM_CLASS =
  'flex cursor-pointer items-center gap-2 rounded-lg border border-transparent px-2 py-1.5 text-sm outline-hidden transition-colors select-none hover:border-dashed hover:border-foreground/30 hover:text-foreground';

interface ProjectListToolbarProps {
  statusFilter: ProjectStatusFilter[];
  onStatusFilterChange: (filter: ProjectStatusFilter[]) => void;
  contextFilter: string[];
  onContextFilterChange: (contexts: string[]) => void;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  sortBy: ProjectSortBy;
  sortDir: 'asc' | 'desc';
  onSortByChange: (sort: ProjectSortBy) => void;
  onSortDirChange: (dir: 'asc' | 'desc') => void;
  statusCounts: Record<string, number>;
  contextCounts: Record<string, number>;
}

export function ProjectListToolbar({
  statusFilter,
  onStatusFilterChange,
  contextFilter,
  onContextFilterChange,
  searchQuery,
  onSearchQueryChange,
  sortBy,
  sortDir,
  onSortByChange,
  onSortDirChange,
  statusCounts,
  contextCounts,
}: ProjectListToolbarProps) {
  const t = useTranslations();

  const activeFilterCount = statusFilter.length + contextFilter.length;
  const isFiltered = activeFilterCount > 0;

  const sortedStatusOptions = sortOptionsAlphabetically(
    STATUS_OPTIONS.map((s) => ({
      value: s,
      label: t(`projects.list.status.${s}` as MessageKey),
    }))
  );

  const sortedContextOptions = sortOptionsAlphabetically(
    PROJECT_CONTEXTS.filter((ctx) => (contextCounts[ctx] ?? 0) > 0).map((ctx) => ({
      value: ctx,
      label: t(PROJECT_CONTEXTS_CONFIG[ctx].labelKey as MessageKey),
    }))
  );

  const sortOptions = sortOptionsAlphabetically(
    SORT_OPTIONS.map((v) => ({
      value: v,
      label: t(`projects.list.sort.${v}` as MessageKey),
    }))
  );

  const handleStatusToggle = (value: ProjectStatusFilter) => {
    if (statusFilter.includes(value)) {
      onStatusFilterChange(statusFilter.filter((s) => s !== value));
    } else {
      onStatusFilterChange([...statusFilter, value]);
    }
  };

  const handleContextToggle = (value: string) => {
    if (contextFilter.includes(value)) {
      onContextFilterChange(contextFilter.filter((c) => c !== value));
    } else {
      onContextFilterChange([...contextFilter, value]);
    }
  };

  const handleClearAll = () => {
    onStatusFilterChange([]);
    onContextFilterChange([]);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <SearchInput
        value={searchQuery}
        onChange={onSearchQueryChange}
        placeholder={t('projects.list.search.placeholder')}
        className="basis-full sm:max-w-sm sm:flex-1 sm:basis-auto"
      />

      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={isFiltered ? 'secondary' : 'outline'}
            className={cn('ml-auto shrink-0 gap-1.5', isFiltered && 'pr-2')}
          >
            <Filter className="size-4" />
            <span className="hidden sm:inline">{t('projects.list.filters.label')}</span>

            {isFiltered && (
              <Badge variant="secondary" className="ml-0.5 size-5 px-0 text-[10px]">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>

        <PopoverContent align="end" className="w-56 p-0">
          <div className="p-2">
            <p className="text-muted-foreground mb-1 px-2 text-xs font-medium">
              {t('projects.list.filters.statusSection')}
            </p>

            <div className="flex flex-col">
              {sortedStatusOptions.map((opt) => (
                <label key={opt.value} className={FILTER_ITEM_CLASS}>
                  <Checkbox
                    checked={statusFilter.includes(opt.value as ProjectStatusFilter)}
                    onCheckedChange={() => handleStatusToggle(opt.value as ProjectStatusFilter)}
                  />

                  <span className="min-w-0 flex-1 truncate">{opt.label}</span>

                  <span className="text-muted-foreground text-xs tabular-nums">
                    {statusCounts[opt.value] ?? 0}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {sortedContextOptions.length > 0 && (
            <>
              <Separator />

              <div className="p-2">
                <p className="text-muted-foreground mb-1 px-2 text-xs font-medium">
                  {t('projects.list.filters.contextSection')}
                </p>

                <div className="flex flex-col">
                  {sortedContextOptions.map((ctx) => (
                    <label key={ctx.value} className={FILTER_ITEM_CLASS}>
                      <Checkbox
                        checked={contextFilter.includes(ctx.value)}
                        onCheckedChange={() => handleContextToggle(ctx.value)}
                      />

                      <span className="min-w-0 flex-1 truncate">{ctx.label}</span>

                      <span className="text-muted-foreground text-xs tabular-nums">
                        {contextCounts[ctx.value] ?? 0}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </>
          )}

          {isFiltered && (
            <>
              <Separator />

              <div className="p-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearAll}
                  className="w-full gap-1.5 text-xs"
                >
                  <X className="size-3" />
                  {t('projects.list.filters.clearFilters')}
                </Button>
              </div>
            </>
          )}
        </PopoverContent>
      </Popover>

      <SortDropdown
        sortBy={sortBy}
        onSortByChange={onSortByChange}
        options={sortOptions}
        sortDir={sortDir}
        onSortDirChange={onSortDirChange}
        dirLabels={{
          asc: t('projects.list.sort.asc'),
          desc: t('projects.list.sort.desc'),
        }}
        sortLabel={t(`projects.list.sort.${sortBy}` as MessageKey)}
      />
    </div>
  );
}
