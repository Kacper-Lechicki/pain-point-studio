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
import { SURVEY_CATEGORIES } from '@/features/surveys/config/survey-categories';
import { cn } from '@/lib/common/utils';

export type SurveyStatusFilter = 'active' | 'draft' | 'completed' | 'cancelled';
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
  statusFilter: SurveyStatusFilter[];
  onStatusFilterChange: (filter: SurveyStatusFilter[]) => void;
  categoryFilter: string[];
  onCategoryFilterChange: (categories: string[]) => void;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  sortBy: SurveySortBy;
  sortDir: SurveySortDir;
  onSortByChange: (sort: SurveySortBy) => void;
  onSortDirChange: (dir: SurveySortDir) => void;
  statusCounts: Record<string, number>;
  categoryCounts: Record<string, number>;
}

const STATUS_OPTIONS: SurveyStatusFilter[] = ['active', 'draft', 'completed', 'cancelled'];

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

const FILTER_ITEM_CLASS =
  'flex cursor-pointer items-center gap-2 rounded-lg border border-transparent px-2 py-1.5 text-sm outline-hidden transition-colors select-none hover:border-dashed hover:border-foreground/30 hover:text-foreground';

export const SurveyListToolbar = ({
  statusFilter,
  onStatusFilterChange,
  categoryFilter,
  onCategoryFilterChange,
  searchQuery,
  onSearchQueryChange,
  sortBy,
  sortDir,
  onSortByChange,
  onSortDirChange,
  statusCounts,
  categoryCounts,
}: SurveyListToolbarProps) => {
  const t = useTranslations();

  const activeFilterCount = statusFilter.length + categoryFilter.length;
  const isFiltered = activeFilterCount > 0;

  const sortedStatusOptions = [...STATUS_OPTIONS].sort((a, b) =>
    t(`surveys.dashboard.filters.${a}`).localeCompare(t(`surveys.dashboard.filters.${b}`))
  );

  const sortedCategories = [...SURVEY_CATEGORIES]
    .filter((cat) => (categoryCounts[cat.value] ?? 0) > 0)
    .sort((a, b) => {
      if (a.value === 'other') {
        return 1;
      }

      if (b.value === 'other') {
        return -1;
      }

      return t(a.labelKey as Parameters<typeof t>[0]).localeCompare(
        t(b.labelKey as Parameters<typeof t>[0])
      );
    });

  const sortOptions = [...SORT_OPTIONS]
    .map((v) => ({ value: v, label: t(`surveys.dashboard.sort.${v}`) }))
    .sort((a, b) => a.label.localeCompare(b.label));

  const handleStatusToggle = (value: SurveyStatusFilter) => {
    if (statusFilter.includes(value)) {
      onStatusFilterChange(statusFilter.filter((s) => s !== value));
    } else {
      onStatusFilterChange([...statusFilter, value]);
    }
  };

  const handleCategoryToggle = (value: string) => {
    if (categoryFilter.includes(value)) {
      onCategoryFilterChange(categoryFilter.filter((c) => c !== value));
    } else {
      onCategoryFilterChange([...categoryFilter, value]);
    }
  };

  const handleClearAll = () => {
    onStatusFilterChange([]);
    onCategoryFilterChange([]);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <SearchInput
        value={searchQuery}
        onChange={onSearchQueryChange}
        placeholder={t('surveys.dashboard.search.placeholder')}
        className="basis-full sm:max-w-sm sm:flex-1 sm:basis-auto"
      />

      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={isFiltered ? 'secondary' : 'outline'}
            className={cn('ml-auto shrink-0 gap-1.5', isFiltered && 'pr-2')}
          >
            <Filter className="size-4" />
            <span className="hidden sm:inline">{t('surveys.dashboard.filters.label')}</span>
            {isFiltered && (
              <Badge variant="secondary" className="ml-0.5 size-5 px-0 text-[10px]">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-56 p-0">
          {/* Status section */}
          <div className="p-2">
            <p className="text-muted-foreground mb-1 px-2 text-xs font-medium">
              {t('surveys.dashboard.filters.statusSection')}
            </p>
            <div className="flex flex-col">
              {sortedStatusOptions.map((status) => (
                <label key={status} className={FILTER_ITEM_CLASS}>
                  <Checkbox
                    checked={statusFilter.includes(status)}
                    onCheckedChange={() => handleStatusToggle(status)}
                  />
                  <span className="min-w-0 flex-1 truncate">
                    {t(`surveys.dashboard.filters.${status}`)}
                  </span>
                  <span className="text-muted-foreground text-xs tabular-nums">
                    {statusCounts[status] ?? 0}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Category section */}
          {sortedCategories.length > 0 && (
            <>
              <Separator />
              <div className="p-2">
                <p className="text-muted-foreground mb-1 px-2 text-xs font-medium">
                  {t('surveys.dashboard.filters.categorySection')}
                </p>
                <div className="flex flex-col">
                  {sortedCategories.map((cat) => (
                    <label key={cat.value} className={FILTER_ITEM_CLASS}>
                      <Checkbox
                        checked={categoryFilter.includes(cat.value)}
                        onCheckedChange={() => handleCategoryToggle(cat.value)}
                      />
                      <span className="min-w-0 flex-1 truncate">
                        {t(cat.labelKey as Parameters<typeof t>[0])}
                      </span>
                      <span className="text-muted-foreground text-xs tabular-nums">
                        {categoryCounts[cat.value]}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Clear filters */}
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
                  {t('surveys.dashboard.filters.clearFilters')}
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
          asc: t('surveys.dashboard.sort.asc'),
          desc: t('surveys.dashboard.sort.desc'),
        }}
        sortLabel={t(`surveys.dashboard.sort.${sortBy}`)}
      />
    </div>
  );
};
