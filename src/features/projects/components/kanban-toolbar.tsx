'use client';

import { ArrowUpDown, Filter, X } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { SearchInput } from '@/components/ui/search-input';
import { Separator } from '@/components/ui/separator';
import { INSIGHT_COLORS } from '@/features/projects/config/insight-colors';
import { INSIGHT_SOURCE_CONFIG } from '@/features/projects/config/insight-sources';
import type { InsightSource, InsightType } from '@/features/projects/types';
import { INSIGHT_SOURCES, INSIGHT_TYPES } from '@/features/projects/types';
import type { MessageKey } from '@/i18n/types';
import { cn } from '@/lib/common/utils';

export type InsightSortBy = 'manual' | 'newest' | 'oldest' | 'updated' | 'alphabetical';

const SORT_OPTIONS: InsightSortBy[] = ['manual', 'newest', 'oldest', 'updated', 'alphabetical'];

const TYPE_LABEL_KEYS: Record<InsightType, string> = {
  strength: 'projects.scorecard.strengths',
  opportunity: 'projects.scorecard.opportunities',
  threat: 'projects.scorecard.threats',
  decision: 'projects.scorecard.decisions',
};

const FILTER_ITEM_CLASS =
  'flex cursor-pointer items-center gap-2 rounded-lg border border-transparent px-2 py-1.5 text-sm outline-hidden transition-colors select-none md:hover:border-dashed md:hover:border-foreground/30 md:hover:text-foreground';

interface KanbanToolbarProps {
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  typeFilter: InsightType[];
  onTypeFilterChange: (types: InsightType[]) => void;
  sourceFilter: InsightSource[];
  onSourceFilterChange: (sources: InsightSource[]) => void;
  sortBy: InsightSortBy;
  onSortByChange: (sort: InsightSortBy) => void;
  typeCounts: Record<InsightType, number>;
}

export function KanbanToolbar({
  searchQuery,
  onSearchQueryChange,
  typeFilter,
  onTypeFilterChange,
  sourceFilter,
  onSourceFilterChange,
  sortBy,
  onSortByChange,
  typeCounts,
}: KanbanToolbarProps) {
  const t = useTranslations();
  const activeFilterCount = typeFilter.length + sourceFilter.length;
  const isFiltered = activeFilterCount > 0;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <SearchInput
        value={searchQuery}
        onChange={onSearchQueryChange}
        placeholder={t('projects.insights.toolbar.searchPlaceholder' as MessageKey)}
        className="basis-full sm:max-w-sm sm:flex-1 sm:basis-auto"
      />

      {/* Type filter */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={isFiltered ? 'secondary' : 'outline'}
            className={cn('ml-auto shrink-0 gap-1.5', isFiltered && 'pr-2')}
          >
            <Filter className="size-4" />
            <span className="hidden sm:inline">
              {t('projects.insights.toolbar.filterLabel' as MessageKey)}
            </span>

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
              {t('projects.insights.toolbar.typeSection' as MessageKey)}
            </p>

            <div className="flex flex-col">
              {INSIGHT_TYPES.map((type) => {
                const colors = INSIGHT_COLORS[type];
                const checked = typeFilter.includes(type);

                return (
                  <label key={type} className={FILTER_ITEM_CLASS}>
                    <Checkbox
                      checked={checked}
                      onCheckedChange={() => {
                        if (checked) {
                          onTypeFilterChange(typeFilter.filter((t) => t !== type));
                        } else {
                          onTypeFilterChange([...typeFilter, type]);
                        }
                      }}
                    />

                    <span className={cn('size-2 rounded-full', colors.dot)} aria-hidden />

                    <span className="min-w-0 flex-1 truncate">
                      {t(TYPE_LABEL_KEYS[type] as MessageKey)}
                    </span>

                    <span className="text-muted-foreground text-xs tabular-nums">
                      {typeCounts[type]}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          <Separator />

          <div className="p-2">
            <p className="text-muted-foreground mb-1 px-2 text-xs font-medium">
              {t('projects.insights.toolbar.sourceSection' as MessageKey)}
            </p>

            <div className="flex flex-col">
              {INSIGHT_SOURCES.map((src) => {
                const config = INSIGHT_SOURCE_CONFIG[src];
                const Icon = config.icon;
                const checked = sourceFilter.includes(src);

                return (
                  <label key={src} className={FILTER_ITEM_CLASS}>
                    <Checkbox
                      checked={checked}
                      onCheckedChange={() => {
                        if (checked) {
                          onSourceFilterChange(sourceFilter.filter((s) => s !== src));
                        } else {
                          onSourceFilterChange([...sourceFilter, src]);
                        }
                      }}
                    />

                    <Icon className="text-muted-foreground size-3.5" aria-hidden />

                    <span className="min-w-0 flex-1 truncate">{t(config.label as MessageKey)}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {isFiltered && (
            <>
              <Separator />

              <div className="p-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    onTypeFilterChange([]);
                    onSourceFilterChange([]);
                  }}
                  className="w-full gap-1.5 text-xs"
                >
                  <X className="size-3" />
                  {t('projects.insights.toolbar.clearFilters' as MessageKey)}
                </Button>
              </div>
            </>
          )}
        </PopoverContent>
      </Popover>

      {/* Sort */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="shrink-0 gap-1.5">
            <ArrowUpDown className="size-4" aria-hidden />
            <span className="hidden sm:inline">
              {t(`projects.insights.toolbar.sort.${sortBy}` as MessageKey)}
            </span>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="min-w-40">
          <DropdownMenuRadioGroup
            value={sortBy}
            onValueChange={(v) => onSortByChange(v as InsightSortBy)}
          >
            {SORT_OPTIONS.map((option) => (
              <DropdownMenuRadioItem key={option} value={option}>
                {t(`projects.insights.toolbar.sort.${option}` as MessageKey)}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
