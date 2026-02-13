'use client';

import { ArrowUpDown, Filter, Search, X } from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/common/utils';

export type SurveyStatusFilter = 'all' | 'active' | 'draft' | 'closed';
export type SurveySortBy = 'updated' | 'created' | 'responses' | 'title';

interface SurveyListToolbarProps {
  statusFilter: SurveyStatusFilter;
  onStatusFilterChange: (filter: SurveyStatusFilter) => void;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  sortBy: SurveySortBy;
  onSortByChange: (sort: SurveySortBy) => void;
  statusCounts: Record<SurveyStatusFilter, number>;
}

const STATUS_FILTERS: SurveyStatusFilter[] = ['all', 'active', 'draft', 'closed'];
const SORT_OPTIONS: SurveySortBy[] = ['updated', 'created', 'responses', 'title'];

export const SurveyListToolbar = ({
  statusFilter,
  onStatusFilterChange,
  searchQuery,
  onSearchQueryChange,
  sortBy,
  onSortByChange,
  statusCounts,
}: SurveyListToolbarProps) => {
  const t = useTranslations('surveys.dashboard');

  const isFiltered = statusFilter !== 'all';
  const hasSearch = searchQuery.trim().length > 0;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Search */}
      <div className="relative min-w-0 basis-full sm:max-w-sm sm:flex-1 sm:basis-auto">
        <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input
          value={searchQuery}
          onChange={(e) => onSearchQueryChange(e.target.value)}
          placeholder={t('search.placeholder')}
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
              {isFiltered ? t(`filters.${statusFilter}`) : t('filters.label')}
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
            {STATUS_FILTERS.map((filter) => (
              <DropdownMenuRadioItem key={filter} value={filter}>
                <span className="flex-1">{t(`filters.${filter}`)}</span>
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
            <ArrowUpDown className="size-4" />
            <span className="hidden sm:inline">{t(`sort.${sortBy}`)}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuRadioGroup
            value={sortBy}
            onValueChange={(v) => onSortByChange(v as SurveySortBy)}
          >
            {SORT_OPTIONS.map((option) => (
              <DropdownMenuRadioItem key={option} value={option}>
                {t(`sort.${option}`)}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
