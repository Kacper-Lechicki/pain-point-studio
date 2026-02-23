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
import { sortOptionsAlphabetically } from '@/lib/common/sort-options';
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

export interface ProjectFilterOption {
  id: string;
  name: string;
  count: number;
}

/** Sentinel value for the "No project" filter option. */
export const NO_PROJECT_FILTER_ID = '__none__';

interface SurveyListToolbarProps {
  statusFilter: SurveyStatusFilter[];
  onStatusFilterChange: (filter: SurveyStatusFilter[]) => void;
  categoryFilter: string[];
  onCategoryFilterChange: (categories: string[]) => void;
  projectFilter: string[];
  onProjectFilterChange: (projectIds: string[]) => void;
  projectOptions: ProjectFilterOption[];
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
  projectFilter,
  onProjectFilterChange,
  projectOptions,
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

  const activeFilterCount = statusFilter.length + categoryFilter.length + projectFilter.length;
  const isFiltered = activeFilterCount > 0;

  const sortedStatusOptions = sortOptionsAlphabetically(
    STATUS_OPTIONS.map((s) => ({ value: s, label: t(`surveys.dashboard.filters.${s}`) }))
  );

  const sortedCategories = sortOptionsAlphabetically(
    SURVEY_CATEGORIES.filter((cat) => (categoryCounts[cat.value] ?? 0) > 0).map((cat) => ({
      value: cat.value,
      label: t(cat.labelKey as Parameters<typeof t>[0]),
      labelKey: cat.labelKey,
    }))
  );

  const sortedProjects = sortOptionsAlphabetically(
    projectOptions.map((p) => ({ value: p.id, label: p.name, count: p.count }))
  );

  const sortOptions = sortOptionsAlphabetically(
    SORT_OPTIONS.map((v) => ({ value: v, label: t(`surveys.dashboard.sort.${v}`) }))
  );

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

  const handleProjectToggle = (value: string) => {
    if (projectFilter.includes(value)) {
      onProjectFilterChange(projectFilter.filter((p) => p !== value));
    } else {
      onProjectFilterChange([...projectFilter, value]);
    }
  };

  const handleClearAll = () => {
    onStatusFilterChange([]);
    onCategoryFilterChange([]);
    onProjectFilterChange([]);
  };

  const noProjectCount = projectOptions.find((p) => p.id === NO_PROJECT_FILTER_ID)?.count ?? 0;
  const namedProjects = sortedProjects.filter((p) => p.value !== NO_PROJECT_FILTER_ID);
  const hasProjectOptions = namedProjects.length > 0 || noProjectCount > 0;

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
          <div className="p-2">
            <p className="text-muted-foreground mb-1 px-2 text-xs font-medium">
              {t('surveys.dashboard.filters.statusSection')}
            </p>

            <div className="flex flex-col">
              {sortedStatusOptions.map((opt) => (
                <label key={opt.value} className={FILTER_ITEM_CLASS}>
                  <Checkbox
                    checked={statusFilter.includes(opt.value as SurveyStatusFilter)}
                    onCheckedChange={() => handleStatusToggle(opt.value as SurveyStatusFilter)}
                  />

                  <span className="min-w-0 flex-1 truncate">{opt.label}</span>

                  <span className="text-muted-foreground text-xs tabular-nums">
                    {statusCounts[opt.value] ?? 0}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {hasProjectOptions && (
            <>
              <Separator />

              <div className="p-2">
                <p className="text-muted-foreground mb-1 px-2 text-xs font-medium">
                  {t('surveys.dashboard.filters.projectSection')}
                </p>

                <div className="flex flex-col">
                  {namedProjects.map((proj) => (
                    <label key={proj.value} className={FILTER_ITEM_CLASS}>
                      <Checkbox
                        checked={projectFilter.includes(proj.value)}
                        onCheckedChange={() => handleProjectToggle(proj.value)}
                      />

                      <span className="min-w-0 flex-1 truncate">{proj.label}</span>

                      <span className="text-muted-foreground text-xs tabular-nums">
                        {(proj as { count?: number }).count ?? 0}
                      </span>
                    </label>
                  ))}

                  {noProjectCount > 0 && (
                    <label className={FILTER_ITEM_CLASS}>
                      <Checkbox
                        checked={projectFilter.includes(NO_PROJECT_FILTER_ID)}
                        onCheckedChange={() => handleProjectToggle(NO_PROJECT_FILTER_ID)}
                      />

                      <span className="text-muted-foreground min-w-0 flex-1 truncate italic">
                        {t('surveys.dashboard.filters.noProject')}
                      </span>

                      <span className="text-muted-foreground text-xs tabular-nums">
                        {noProjectCount}
                      </span>
                    </label>
                  )}
                </div>
              </div>
            </>
          )}

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

                      <span className="min-w-0 flex-1 truncate">{cat.label}</span>

                      <span className="text-muted-foreground text-xs tabular-nums">
                        {categoryCounts[cat.value]}
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
