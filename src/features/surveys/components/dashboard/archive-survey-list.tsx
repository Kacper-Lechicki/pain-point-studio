'use client';

import { useMemo, useState } from 'react';

import { Archive, MousePointerClick } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { SearchInput } from '@/components/ui/search-input';
import { SortDropdown } from '@/components/ui/sort-dropdown';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { UserSurvey } from '@/features/surveys/actions/get-user-surveys';
import { useSurveyListState } from '@/features/surveys/hooks/use-survey-list-state';
import { useSurveySelection } from '@/features/surveys/hooks/use-survey-selection';
import { applyOptimisticStatusChange } from '@/features/surveys/lib/status-change-handler';

import { SortableTableHeader } from './sortable-table-header';
import { SurveyDetailSheet } from './survey-detail-sheet';
import { SurveyListRow } from './survey-list-row';

type ArchiveSortBy = 'updated' | 'created' | 'title' | 'questions' | 'autoDeletes' | 'archivedAt';

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

const CUSTOM_COMPARATOR = (sortBy: ArchiveSortBy, sortDir: 'asc' | 'desc') => {
  if (sortBy !== 'archivedAt' && sortBy !== 'autoDeletes') {
    return undefined;
  }

  const mul = sortDir === 'asc' ? 1 : -1;

  return (a: UserSurvey, b: UserSurvey) => {
    const ta = a.archivedAt ? new Date(a.archivedAt).getTime() : 0;
    const tb = b.archivedAt ? new Date(b.archivedAt).getTime() : 0;

    return mul * (ta - tb) || a.title.localeCompare(b.title);
  };
};

export function ArchiveSurveyList({ initialSurveys }: ArchiveSurveyListProps) {
  const t = useTranslations();
  const [surveys, setSurveys] = useState(initialSurveys);

  const {
    now,
    isMd,
    searchQuery,
    setSearchQuery,
    sortBy,
    sortDir,
    setSortDir,
    handleSortByChange,
    handleSortByColumn,
    filteredSurveys,
  } = useSurveyListState<ArchiveSortBy>({
    surveys,
    defaultSortBy: 'updated',
    customComparator: CUSTOM_COMPARATOR,
  });

  const { selectedId, selectedSurvey, questions, showSheet, setSelected } =
    useSurveySelection(surveys);

  const hasSearch = searchQuery.trim().length > 0;

  const sortOptions = useMemo(
    () =>
      [...SORT_OPTIONS]
        .map((v) => ({ value: v, label: t(`surveys.archive.sort.${v}`) }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [t]
  );

  const handleStatusChange = (surveyId: string, action: string) => {
    const { shouldDeselect, updatedSurveys } = applyOptimisticStatusChange(
      surveys,
      surveyId,
      action
    );

    if (shouldDeselect && selectedId === surveyId) {
      setSelected(null);
    }

    setSurveys(updatedSurveys);
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
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder={t('surveys.dashboard.search.placeholder')}
          className="basis-full sm:max-w-sm sm:flex-1 sm:basis-auto"
        />

        <SortDropdown
          sortBy={sortBy}
          onSortByChange={handleSortByChange}
          options={sortOptions}
          sortDir={sortDir}
          onSortDirChange={setSortDir}
          dirLabels={{
            asc: t('surveys.dashboard.sort.asc'),
            desc: t('surveys.dashboard.sort.desc'),
          }}
          sortLabel={t(`surveys.archive.sort.${sortBy}`)}
          className="ml-auto"
        />
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
                  now={now}
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
              now={now}
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
        now={now}
        onStatusChange={handleStatusChange}
        detailsLabel={t('surveys.dashboard.detailPanel.detailsLabel')}
      />
    </div>
  );
}
