'use client';

import { ArrowUpDown, Search } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export type SurveyStatusFilter = 'all' | 'active' | 'draft' | 'closed' | 'archived';
export type SurveySortBy = 'updated' | 'created' | 'responses' | 'title';

interface SurveyListToolbarProps {
  statusFilter: SurveyStatusFilter;
  onStatusFilterChange: (status: SurveyStatusFilter) => void;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  sortBy: SurveySortBy;
  onSortByChange: (sort: SurveySortBy) => void;
}

const STATUS_FILTERS: SurveyStatusFilter[] = ['all', 'active', 'draft', 'closed', 'archived'];
const SORT_OPTIONS: SurveySortBy[] = ['updated', 'created', 'responses', 'title'];

export const SurveyListToolbar = ({
  statusFilter,
  onStatusFilterChange,
  searchQuery,
  onSearchQueryChange,
  sortBy,
  onSortByChange,
}: SurveyListToolbarProps) => {
  const t = useTranslations('surveys.dashboard');

  return (
    <div className="space-y-3">
      <Tabs
        value={statusFilter}
        onValueChange={(v) => onStatusFilterChange(v as SurveyStatusFilter)}
      >
        <TabsList className="w-full sm:w-auto">
          {STATUS_FILTERS.map((filter) => (
            <TabsTrigger key={filter} value={filter}>
              {t(`filters.${filter === 'draft' ? 'drafts' : filter}`)}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            placeholder={t('search.placeholder')}
            className="pl-9"
          />
        </div>

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
    </div>
  );
};
