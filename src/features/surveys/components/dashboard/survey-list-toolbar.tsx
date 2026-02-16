'use client';

import { Filter } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SearchInput } from '@/components/ui/search-input';
import { SortDropdown } from '@/components/ui/sort-dropdown';
import { cn } from '@/lib/common/utils';

export type SurveyStatusFilter = 'all' | 'active' | 'draft' | 'completed' | 'cancelled';
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
}

const STATUS_FILTERS: SurveyStatusFilter[] = ['all', 'active', 'draft', 'completed', 'cancelled'];

const SORT_OPTIONS: SurveySortBy[] = [
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
}: SurveyListToolbarProps) => {
  const t = useTranslations();

  const isFiltered = statusFilter !== 'all';
  const sortedStatusFilters = [
    'all' as SurveyStatusFilter,
    ...STATUS_FILTERS.filter((s) => s !== 'all').sort((a, b) =>
      t(`surveys.dashboard.filters.${a}`).localeCompare(t(`surveys.dashboard.filters.${b}`))
    ),
  ];
  const sortOptions = [...SORT_OPTIONS]
    .map((v) => ({ value: v, label: t(`surveys.dashboard.sort.${v}`) }))
    .sort((a, b) => a.label.localeCompare(b.label));

  return (
    <div className="flex flex-wrap items-center gap-2">
      <SearchInput
        value={searchQuery}
        onChange={onSearchQueryChange}
        placeholder={t('surveys.dashboard.search.placeholder')}
        className="basis-full sm:max-w-sm sm:flex-1 sm:basis-auto"
      />

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

      <SortDropdown
        sortBy={sortBy}
        onSortByChange={onSortByChange}
        options={sortOptions}
        sortDir={sortDir}
        onSortDirChange={onSortDirChange}
        dirLabels={{
          asc: t('surveys.dashboard.sort.asc'),
          desc: t('surveys.dashboard.sort.desc'),
        }}
        sortLabel={t(`surveys.dashboard.sort.${sortBy}`)}
      />
    </div>
  );
};
