'use client';

import { ArrowDown, ArrowUp, Filter, Search, X } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Badge } from '@/components/ui/badge';
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
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/common/utils';

export type SurveyStatusFilter = 'all' | 'active' | 'draft' | 'pending' | 'closed' | 'cancelled';
export type SurveySortBy =
  | 'updated'
  | 'created'
  | 'responses'
  | 'title'
  | 'status'
  | 'questions'
  | 'lastResponse'
  | 'activity';

export type SurveySortDir = 'asc' | 'desc';

interface SurveyListToolbarProps {
  statusFilter: SurveyStatusFilter;
  onStatusFilterChange: (filter: SurveyStatusFilter) => void;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  sortBy: SurveySortBy;
  sortDir: SurveySortDir;
  onSortByChange: (sort: SurveySortBy) => void;
  onSortDirChange: (dir: SurveySortDir) => void;
  statusCounts: Record<SurveyStatusFilter, number>;
  /** When true, table with sortable column headers is shown – dropdown only offers updated/created. When false (mobile), dropdown offers all options in column order. */
  hasSortableColumns: boolean;
}

const STATUS_FILTERS: SurveyStatusFilter[] = [
  'all',
  'active',
  'draft',
  'pending',
  'closed',
  'cancelled',
];

const SORT_OPTIONS_DESKTOP: SurveySortBy[] = ['updated', 'created'];

const SORT_OPTIONS_MOBILE: SurveySortBy[] = [
  'title',
  'status',
  'questions',
  'responses',
  'lastResponse',
  'activity',
  'updated',
  'created',
];

export const SurveyListToolbar = ({
  statusFilter,
  onStatusFilterChange,
  searchQuery,
  onSearchQueryChange,
  sortBy,
  sortDir,
  onSortByChange,
  onSortDirChange,
  statusCounts,
  hasSortableColumns,
}: SurveyListToolbarProps) => {
  const t = useTranslations();

  const isFiltered = statusFilter !== 'all';
  const hasSearch = searchQuery.trim().length > 0;
  const sortOptions = hasSortableColumns ? SORT_OPTIONS_DESKTOP : SORT_OPTIONS_MOBILE;
  const sortedStatusFilters = [...STATUS_FILTERS].sort((a, b) =>
    t(`surveys.dashboard.filters.${a}`).localeCompare(t(`surveys.dashboard.filters.${b}`))
  );
  const sortedSortOptions = [...sortOptions].sort((a, b) =>
    t(`surveys.dashboard.sort.${a}`).localeCompare(t(`surveys.dashboard.sort.${b}`))
  );

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Search */}
      <div className="relative min-w-0 basis-full sm:max-w-sm sm:flex-1 sm:basis-auto">
        <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input
          value={searchQuery}
          onChange={(e) => onSearchQueryChange(e.target.value)}
          placeholder={t('surveys.dashboard.search.placeholder')}
          className={cn('pl-9', hasSearch && 'pr-9')}
        />
        {hasSearch && (
          <button
            type="button"
            onClick={() => onSearchQueryChange('')}
            className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 transition-colors"
            aria-label="Clear search"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {/* Status filter */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant={isFiltered ? 'secondary' : 'outline'}
            className={cn('ml-auto shrink-0 gap-1.5', isFiltered && 'pr-2')}
          >
            <Filter className="size-4" />
            <span className="hidden sm:inline">
              {isFiltered
                ? t(`surveys.dashboard.filters.${statusFilter}`)
                : t('surveys.dashboard.filters.label')}
            </span>
            {isFiltered && (
              <Badge variant="secondary" className="ml-0.5 size-5 px-0 text-[10px]">
                {statusCounts[statusFilter]}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuRadioGroup
            value={statusFilter}
            onValueChange={(v) => onStatusFilterChange(v as SurveyStatusFilter)}
          >
            {sortedStatusFilters.map((filter) => (
              <DropdownMenuRadioItem key={filter} value={filter}>
                <span className="flex-1">{t(`surveys.dashboard.filters.${filter}`)}</span>
                <span className="text-muted-foreground ml-3 tabular-nums">
                  {statusCounts[filter]}
                </span>
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Sort */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="shrink-0 gap-1.5">
            {sortDir === 'asc' ? (
              <ArrowUp className="size-4" aria-hidden />
            ) : (
              <ArrowDown className="size-4" aria-hidden />
            )}
            <span className="hidden sm:inline">{t(`surveys.dashboard.sort.${sortBy}`)}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-40">
          <DropdownMenuRadioGroup
            value={sortBy}
            onValueChange={(v) => onSortByChange(v as SurveySortBy)}
          >
            {sortedSortOptions.map((option) => (
              <DropdownMenuRadioItem key={option} value={option}>
                {t(`surveys.dashboard.sort.${option}`)}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              onSortDirChange(sortDir === 'asc' ? 'desc' : 'asc');
            }}
          >
            {sortDir === 'asc' ? (
              <ArrowUp className="size-4" aria-hidden />
            ) : (
              <ArrowDown className="size-4" aria-hidden />
            )}
            {sortDir === 'asc' ? t('surveys.dashboard.sort.asc') : t('surveys.dashboard.sort.desc')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
