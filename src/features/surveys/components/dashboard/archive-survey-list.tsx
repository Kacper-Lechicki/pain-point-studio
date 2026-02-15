'use client';

import { useMemo, useState } from 'react';

import { Archive, ArrowDown, ArrowUp, MousePointerClick, Search, X } from 'lucide-react';
import { useTranslations } from 'next-intl';

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
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { UserSurvey } from '@/features/surveys/actions/get-user-surveys';
import { useSurveySelection } from '@/features/surveys/hooks/use-survey-selection';
import { getDefaultSortDir, getSurveyComparator } from '@/features/surveys/lib/sort-helpers';
import { useBreakpoint } from '@/hooks/common/use-breakpoint';
import { cn } from '@/lib/common/utils';

import { SortableTableHeader } from './sortable-table-header';
import { SurveyDetailSheet } from './survey-detail-sheet';
import { SurveyListRow } from './survey-list-row';

type ArchiveSortBy = 'updated' | 'created' | 'title' | 'questions' | 'autoDeletes' | 'archivedAt';
type ArchiveSortDir = 'asc' | 'desc';

interface ArchiveSurveyListProps {
  initialSurveys: UserSurvey[];
}

const SORT_OPTIONS: ArchiveSortBy[] = [
  'title',
  'questions',
  'archivedAt',
  'autoDeletes',
  'updated',
  'created',
];

export function ArchiveSurveyList({ initialSurveys }: ArchiveSurveyListProps) {
  const t = useTranslations();
  const isMd = useBreakpoint('md');

  const [surveys, setSurveys] = useState(initialSurveys);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<ArchiveSortBy>('updated');
  const [sortDir, setSortDir] = useState<ArchiveSortDir>('desc');

  const { selectedId, selectedSurvey, questions, showSheet, setSelected } =
    useSurveySelection(surveys);

  const hasSearch = searchQuery.trim().length > 0;

  const handleSortByColumn = (key: ArchiveSortBy) => {
    if (sortBy === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(key);
      setSortDir(getDefaultSortDir(key));
    }
  };

  const handleSortByChange = (key: ArchiveSortBy) => {
    setSortBy(key);
    setSortDir(getDefaultSortDir(key));
  };

  const sortedSortOptions = useMemo(
    () =>
      [...SORT_OPTIONS].sort((a, b) =>
        t(`surveys.archive.sort.${a}`).localeCompare(t(`surveys.archive.sort.${b}`))
      ),
    [t]
  );

  const filteredSurveys = useMemo(() => {
    let result = surveys;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (s) => s.title.toLowerCase().includes(q) || s.description.toLowerCase().includes(q)
      );
    }

    const common = getSurveyComparator(sortBy, sortDir);

    if (common) {
      return [...result].sort(common);
    }

    const mul = sortDir === 'asc' ? 1 : -1;

    return [...result].sort((a, b) => {
      switch (sortBy) {
        case 'archivedAt':
        case 'autoDeletes': {
          // Both sort by archivedAt timestamp (autoDeletes is derived from it)
          const ta = a.archivedAt ? new Date(a.archivedAt).getTime() : 0;
          const tb = b.archivedAt ? new Date(b.archivedAt).getTime() : 0;

          return mul * (ta - tb) || a.title.localeCompare(b.title);
        }

        default:
          return 0;
      }
    });
  }, [surveys, searchQuery, sortBy, sortDir]);

  const handleStatusChange = (surveyId: string, action: string) => {
    if (action === 'restore' || action === 'delete') {
      if (selectedId === surveyId) {
        setSelected(null);
      }

      setSurveys((prev) => prev.filter((s) => s.id !== surveyId));
    }
  };

  if (filteredSurveys.length === 0 && !hasSearch && surveys.length === 0) {
    return (
      <EmptyState
        icon={Archive}
        title={t('surveys.archive.empty.title')}
        description={t('surveys.archive.empty.description')}
      />
    );
  }

  return (
    <div className="space-y-4">
      {surveys.length > 0 && (
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-x-4 gap-y-1">
          <div className="text-muted-foreground flex min-w-0 flex-wrap items-center gap-x-3 text-xs">
            <span className="shrink-0">
              <span className="text-foreground text-base font-semibold tabular-nums">
                {surveys.length}
              </span>
              <span className="ml-1">{t('surveys.dashboard.summary.totalLabel')}</span>
            </span>
          </div>
          <span className="text-muted-foreground hidden shrink-0 items-center gap-1 text-[11px] md:flex">
            <MousePointerClick className="size-3" aria-hidden />
            {t('surveys.dashboard.clickHint')}
          </span>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 basis-full sm:max-w-sm sm:flex-1 sm:basis-auto">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('surveys.dashboard.search.placeholder')}
            className={cn('pl-9', hasSearch && 'pr-9')}
          />
          {hasSearch && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 transition-colors"
              aria-label="Clear search"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto shrink-0 gap-1.5">
              {sortDir === 'asc' ? (
                <ArrowUp className="size-4" aria-hidden />
              ) : (
                <ArrowDown className="size-4" aria-hidden />
              )}
              <span className="hidden sm:inline">{t(`surveys.archive.sort.${sortBy}`)}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-40">
            <DropdownMenuRadioGroup
              value={sortBy}
              onValueChange={(v) => handleSortByChange(v as ArchiveSortBy)}
            >
              {sortedSortOptions.map((option) => (
                <DropdownMenuRadioItem key={option} value={option}>
                  {t(`surveys.archive.sort.${option}`)}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
                setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
              }}
            >
              {sortDir === 'asc' ? (
                <ArrowUp className="size-4" aria-hidden />
              ) : (
                <ArrowDown className="size-4" aria-hidden />
              )}
              {sortDir === 'asc'
                ? t('surveys.dashboard.sort.asc')
                : t('surveys.dashboard.sort.desc')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {filteredSurveys.length === 0 ? (
        <EmptyState
          icon={Archive}
          title={
            hasSearch
              ? t('surveys.archive.emptySearch.title', { query: searchQuery })
              : t('surveys.archive.empty.title')
          }
          description={
            hasSearch
              ? t('surveys.archive.emptySearch.description')
              : t('surveys.archive.empty.description')
          }
          action={
            hasSearch && (
              <Button variant="outline" size="sm" onClick={() => setSearchQuery('')}>
                {t('surveys.dashboard.clearFilters')}
              </Button>
            )
          }
        />
      ) : isMd ? (
        <div className="border-border/50 overflow-hidden rounded-lg border">
          <Table className="table-fixed">
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <SortableTableHeader
                  sortKey="title"
                  currentSortKey={sortBy}
                  sortDir={sortDir}
                  onSort={handleSortByColumn}
                  label={t('surveys.dashboard.table.title')}
                  className="w-[30%]"
                />
                <SortableTableHeader
                  sortKey="questions"
                  currentSortKey={sortBy}
                  sortDir={sortDir}
                  onSort={handleSortByColumn}
                  label={t('surveys.dashboard.table.questions')}
                  className="border-border/30 border-l"
                />
                <SortableTableHeader
                  sortKey="archivedAt"
                  currentSortKey={sortBy}
                  sortDir={sortDir}
                  onSort={handleSortByColumn}
                  label={t('surveys.dashboard.table.archivedAt')}
                  className="border-border/30 border-l"
                />
                <SortableTableHeader
                  sortKey="autoDeletes"
                  currentSortKey={sortBy}
                  sortDir={sortDir}
                  onSort={handleSortByColumn}
                  label={t('surveys.dashboard.table.autoDeletes')}
                  className="border-border/30 border-l"
                />
                <TableHead className="w-10" aria-hidden />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSurveys.map((survey) => (
                <SurveyListRow
                  key={survey.id}
                  survey={survey}
                  isSelected={selectedId === survey.id}
                  onSelect={setSelected}
                  onStatusChange={handleStatusChange}
                  variant="table"
                  archivedLayout
                />
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="flex min-w-0 flex-col gap-2" role="list">
          {filteredSurveys.map((survey) => (
            <SurveyListRow
              key={survey.id}
              survey={survey}
              isSelected={selectedId === survey.id}
              onSelect={setSelected}
              onStatusChange={handleStatusChange}
              variant="card"
              archivedLayout
            />
          ))}
        </div>
      )}

      <SurveyDetailSheet
        open={showSheet}
        onClose={() => setSelected(null)}
        survey={selectedSurvey}
        questions={questions}
        onStatusChange={handleStatusChange}
        detailsLabel={t('surveys.dashboard.detailPanel.detailsLabel')}
      />
    </div>
  );
}
