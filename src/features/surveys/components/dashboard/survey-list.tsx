'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { ClipboardList, MousePointerClick, RefreshCw } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { UserSurvey } from '@/features/surveys/actions/get-user-surveys';
import { KPI_COLOR_ALL, SURVEY_STATUS_CONFIG } from '@/features/surveys/config/survey-status';
import { useRealtimeSurveyList } from '@/features/surveys/hooks/use-realtime-survey-list';
import { useSurveyListState } from '@/features/surveys/hooks/use-survey-list-state';
import { useSurveySelection } from '@/features/surveys/hooks/use-survey-selection';
import { applyOptimisticStatusChange } from '@/features/surveys/lib/status-change-handler';
import { useRefresh } from '@/hooks/common/use-refresh';
import { cn } from '@/lib/common/utils';

import { SortableTableHeader } from './sortable-table-header';
import { SurveyDetailSheet } from './survey-detail-sheet';
import { SurveyListRow } from './survey-list-row';
import {
  SurveyListToolbar,
  type SurveySortBy,
  type SurveyStatusFilter,
} from './survey-list-toolbar';

const PRE_FILTER = (s: UserSurvey) => s.status !== 'archived';

const CUSTOM_COMPARATOR = (sortBy: SurveySortBy, sortDir: 'asc' | 'desc') => {
  const mul = sortDir === 'asc' ? 1 : -1;

  switch (sortBy) {
    case 'responses':
      return (a: UserSurvey, b: UserSurvey) => mul * (a.responseCount - b.responseCount);
    case 'lastResponse':
      return (a: UserSurvey, b: UserSurvey) => {
        const ta = a.lastResponseAt ? new Date(a.lastResponseAt).getTime() : 0;
        const tb = b.lastResponseAt ? new Date(b.lastResponseAt).getTime() : 0;

        return mul * (ta - tb) || a.title.localeCompare(b.title);
      };

    case 'activity':
      return (a: UserSurvey, b: UserSurvey) => {
        const sumA = a.recentActivity.reduce((s, n) => s + n, 0);
        const sumB = b.recentActivity.reduce((s, n) => s + n, 0);

        return mul * (sumA - sumB) || a.title.localeCompare(b.title);
      };

    default:
      return undefined;
  }
};

interface SurveyListProps {
  initialSurveys: UserSurvey[];
}

export const SurveyList = ({ initialSurveys }: SurveyListProps) => {
  const t = useTranslations();
  const { isRefreshing, refresh } = useRefresh();
  const [surveys, setSurveys] = useState(initialSurveys);
  const [statusFilter, setStatusFilter] = useState<SurveyStatusFilter>('all');

  useEffect(() => {
    setSurveys(initialSurveys);
  }, [initialSurveys]);

  const { isConnected: isRealtimeConnected } = useRealtimeSurveyList();

  const preFilter = useCallback(
    (s: UserSurvey) => PRE_FILTER(s) && (statusFilter === 'all' || s.status === statusFilter),
    [statusFilter]
  );

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
  } = useSurveyListState<SurveySortBy>({
    surveys,
    defaultSortBy: 'updated',
    preFilter,
    customComparator: CUSTOM_COMPARATOR,
  });

  const { selectedId, selectedSurvey, questions, showSheet, setSelected } =
    useSurveySelection(surveys);

  const statusCounts = useMemo(() => {
    const counts: Record<SurveyStatusFilter, number> = {
      all: 0,
      active: 0,
      draft: 0,
      completed: 0,
      cancelled: 0,
    };

    for (const s of surveys) {
      if (s.status !== 'archived' && s.status in counts) {
        counts[s.status as SurveyStatusFilter]++;
      }
    }

    counts.all = counts.active + counts.draft + counts.completed + counts.cancelled;

    return counts;
  }, [surveys]);

  const kpiStatuses = useMemo(() => {
    const order: Exclude<SurveyStatusFilter, 'all'>[] = [
      'active',
      'draft',
      'completed',
      'cancelled',
    ];

    return order.filter((s) => statusCounts[s] > 0);
  }, [statusCounts]);

  const isFiltered = statusFilter !== 'all';

  const handleStatusChange = (surveyId: string, action: string) => {
    const { shouldDeselect, updatedSurveys } = applyOptimisticStatusChange(
      surveys,
      surveyId,
      action,
      ['archived']
    );

    if (shouldDeselect && selectedId === surveyId) {
      setSelected(null);
    }

    setSurveys(updatedSurveys);
  };

  return (
    <div className="space-y-4">
      {kpiStatuses.length > 0 && (
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-x-4 gap-y-1">
          <div className="text-muted-foreground flex min-w-0 flex-wrap items-center gap-x-3 text-xs">
            <span>
              <span className={cn('text-base font-semibold tabular-nums', KPI_COLOR_ALL)}>
                {statusCounts.all}
              </span>
              <span className="ml-1">{t('surveys.dashboard.summary.totalLabel')}</span>
            </span>

            <span className="text-border" aria-hidden>
              /
            </span>

            {kpiStatuses.map((status, i) => (
              <span key={status} className="flex shrink-0 items-center gap-x-3">
                {i > 0 && (
                  <span className="text-border" aria-hidden>
                    /
                  </span>
                )}
                <span>
                  <span
                    className={cn(
                      'text-base font-semibold tabular-nums',
                      SURVEY_STATUS_CONFIG[status].kpiColor
                    )}
                  >
                    {statusCounts[status]}
                  </span>
                  <span className="ml-1">
                    {t(`surveys.dashboard.status.${status}` as Parameters<typeof t>[0])}
                  </span>
                </span>
              </span>
            ))}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="text-muted-foreground hidden items-center gap-1 text-[11px] md:flex">
              <MousePointerClick className="size-3" aria-hidden />
              {t('surveys.dashboard.clickHint')}
            </span>
            <div className="relative">
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={refresh}
                disabled={isRefreshing}
                aria-label={t('surveys.dashboard.refresh')}
                title={t('surveys.dashboard.refresh')}
              >
                <RefreshCw className={cn('size-3', isRefreshing && 'animate-spin')} aria-hidden />
              </Button>
              <span
                className={cn(
                  'absolute -top-px -right-px size-1.5 rounded-full',
                  isRealtimeConnected ? 'bg-emerald-500' : 'bg-amber-500'
                )}
                aria-hidden
              />
            </div>
          </div>
        </div>
      )}

      <SurveyListToolbar
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        sortBy={sortBy}
        sortDir={sortDir}
        onSortByChange={handleSortByChange}
        onSortDirChange={setSortDir}
        statusCounts={statusCounts}
      />

      {filteredSurveys.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title={
            searchQuery.trim()
              ? t('surveys.dashboard.emptySearch.title', { query: searchQuery })
              : t('surveys.dashboard.emptyFilter.title')
          }
          description={
            searchQuery.trim()
              ? t('surveys.dashboard.emptySearch.description')
              : t('surveys.dashboard.emptyFilter.description')
          }
          action={
            (searchQuery.trim() || isFiltered) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                }}
              >
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
                  sortKey="status"
                  currentSortKey={sortBy}
                  sortDir={sortDir}
                  onSort={handleSortByColumn}
                  label={t('surveys.dashboard.table.status')}
                  className="border-border/30 border-l"
                  centered
                />
                <SortableTableHeader
                  sortKey="responses"
                  currentSortKey={sortBy}
                  sortDir={sortDir}
                  onSort={handleSortByColumn}
                  label={t('surveys.dashboard.table.responses')}
                  className="border-border/30 border-l"
                />
                <SortableTableHeader
                  sortKey="questions"
                  currentSortKey={sortBy}
                  sortDir={sortDir}
                  onSort={handleSortByColumn}
                  label={t('surveys.dashboard.table.questions')}
                  className="border-border/30 hidden border-l lg:table-cell"
                />
                <SortableTableHeader
                  sortKey="lastResponse"
                  currentSortKey={sortBy}
                  sortDir={sortDir}
                  onSort={handleSortByColumn}
                  label={t('surveys.dashboard.table.lastResponse')}
                  className="border-border/30 hidden border-l xl:table-cell"
                />
                <SortableTableHeader
                  sortKey="activity"
                  currentSortKey={sortBy}
                  sortDir={sortDir}
                  onSort={handleSortByColumn}
                  label={t('surveys.dashboard.table.activity')}
                  className="border-border/30 hidden border-l 2xl:table-cell"
                  centered
                />
                <TableHead className="w-10" aria-hidden />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSurveys.map((survey: UserSurvey) => (
                <SurveyListRow
                  key={survey.id}
                  survey={survey}
                  now={now}
                  isSelected={selectedId === survey.id}
                  onSelect={setSelected}
                  onStatusChange={handleStatusChange}
                  variant="table"
                />
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="flex min-w-0 flex-col gap-2" role="list">
          {filteredSurveys.map((survey: UserSurvey) => (
            <SurveyListRow
              key={survey.id}
              survey={survey}
              now={now}
              isSelected={selectedId === survey.id}
              onSelect={setSelected}
              onStatusChange={handleStatusChange}
              variant="card"
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
};
