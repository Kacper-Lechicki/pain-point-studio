'use client';

import { ArrowUpDown, Plus, SlidersHorizontal } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SearchInput } from '@/components/ui/search-input';
import { ROUTES } from '@/config/routes';
import { SURVEY_STATUS_CONFIG } from '@/features/surveys/config/survey-status';
import { SURVEY_STATUSES, type SurveyStatus } from '@/features/surveys/types';
import Link from '@/i18n/link';
import type { MessageKey } from '@/i18n/types';

export type SortKey = 'newest' | 'oldest' | 'mostResponses' | 'titleAz';

interface SurveyTableToolbarProps {
  projectId: string;
  isArchived: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  sort: SortKey;
  onSortChange: (value: SortKey) => void;
  statusFilter: SurveyStatus | null;
  onStatusFilterChange: (value: SurveyStatus | null) => void;
}

const SORT_OPTIONS: SortKey[] = ['newest', 'oldest', 'mostResponses', 'titleAz'];

export function SurveyTableToolbar({
  projectId,
  isArchived,
  search,
  onSearchChange,
  sort,
  onSortChange,
  statusFilter,
  onStatusFilterChange,
}: SurveyTableToolbarProps) {
  const t = useTranslations();

  return (
    <div className="flex flex-wrap items-center gap-2">
      <SearchInput
        value={search}
        onChange={onSearchChange}
        placeholder={t('projects.detail.searchPlaceholder')}
        className="min-w-0 flex-1 basis-full sm:basis-auto"
      />

      {/* Status filter */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1.5">
            <SlidersHorizontal className="size-3.5" aria-hidden />
            {t('projects.detail.research.toolbar.filter')}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuCheckboxItem
            checked={statusFilter === null}
            onCheckedChange={() => onStatusFilterChange(null)}
          >
            {t('projects.detail.research.filter.allStatuses')}
          </DropdownMenuCheckboxItem>
          {SURVEY_STATUSES.map((status) => (
            <DropdownMenuCheckboxItem
              key={status}
              checked={statusFilter === status}
              onCheckedChange={() => onStatusFilterChange(statusFilter === status ? null : status)}
            >
              {t(SURVEY_STATUS_CONFIG[status].labelKey as MessageKey)}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Sort */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1.5">
            <ArrowUpDown className="size-3.5" aria-hidden />
            {t('projects.detail.research.toolbar.sort')}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuRadioGroup value={sort} onValueChange={(v) => onSortChange(v as SortKey)}>
            {SORT_OPTIONS.map((key) => (
              <DropdownMenuRadioItem key={key} value={key}>
                {t(`projects.detail.research.sort.${key}` as MessageKey)}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* New Survey button */}
      {!isArchived && (
        <Button size="sm" className="gap-1.5" asChild>
          <Link href={`${ROUTES.dashboard.researchNew}?projectId=${projectId}`}>
            <Plus className="size-3.5" aria-hidden />
            {t('projects.detail.research.toolbar.newSurvey')}
          </Link>
        </Button>
      )}
    </div>
  );
}
