'use client';

import { useEffect, useMemo, useState } from 'react';

import { useRouter } from 'next/navigation';

import { ClipboardList, MousePointerClick, RefreshCw } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { UserSurvey } from '@/features/surveys/actions/get-user-surveys';
import { useRealtimeSurveyList } from '@/features/surveys/hooks/use-realtime-survey-list';
import { useSurveySelection } from '@/features/surveys/hooks/use-survey-selection';
import { getDefaultSortDir, getSurveyComparator } from '@/features/surveys/lib/sort-helpers';
import type { SurveyStatus } from '@/features/surveys/types';
import { useBreakpoint } from '@/hooks/common/use-breakpoint';
import { cn } from '@/lib/common/utils';

import { SortableTableHeader } from './sortable-table-header';
import { SurveyDetailSheet } from './survey-detail-sheet';
import { SurveyListRow } from './survey-list-row';
import {
  SurveyListToolbar,
  type SurveySortBy,
  type SurveySortDir,
  type SurveyStatusFilter,
} from './survey-list-toolbar';

/** Text color classes for each status in the KPI summary. */
const STATUS_KPI_COLOR: Record<string, string> = {
  all: 'text-foreground',
  active: 'text-emerald-600 dark:text-emerald-400',
  draft: 'text-foreground',
  closed: 'text-violet-600 dark:text-violet-400',
  cancelled: 'text-red-600 dark:text-red-400',
};

const STATUS_TRANSITIONS: Record<string, SurveyStatus | null> = {
  close: 'closed',
  cancel: 'cancelled',
  archive: 'archived',
  delete: null,
} as const;

interface SurveyListProps {
  initialSurveys: UserSurvey[];
}

export const SurveyList = ({ initialSurveys }: SurveyListProps) => {
  const t = useTranslations();
  const router = useRouter();
  const isMd = useBreakpoint('md');
  const [surveys, setSurveys] = useState(initialSurveys);

  // Sync local state when the server re-renders with fresh data (e.g. from
  // router.refresh() triggered by the realtime subscription).
  useEffect(() => {
    setSurveys(initialSurveys);
  }, [initialSurveys]);

  // Subscribe to Realtime so response counts, activity, and status changes
  // (including auto-close) are reflected without a manual page reload.
  useRealtimeSurveyList();
  const [statusFilter, setStatusFilter] = useState<SurveyStatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SurveySortBy>('updated');
  const [sortDir, setSortDir] = useState<SurveySortDir>('desc');

  const { selectedId, selectedSurvey, questions, showSheet, setSelected } =
    useSurveySelection(surveys);

  const statusCounts = useMemo(() => {
    const counts: Record<SurveyStatusFilter, number> = {
      all: 0,
      active: 0,
      draft: 0,
      closed: 0,
      cancelled: 0,
    };

    for (const s of surveys) {
      if (s.status !== 'archived' && s.status in counts) {
        counts[s.status as SurveyStatusFilter]++;
      }
    }

    counts.all = counts.active + counts.draft + counts.closed + counts.cancelled;

    return counts;
  }, [surveys]);

  const kpiStatuses = useMemo(() => {
    const order: Exclude<SurveyStatusFilter, 'all'>[] = ['active', 'draft', 'closed', 'cancelled'];

    return order.filter((s) => statusCounts[s] > 0);
  }, [statusCounts]);

  const filteredSurveys = useMemo(() => {
    let result =
      statusFilter === 'all'
        ? surveys.filter((s) => s.status !== 'archived')
        : surveys.filter((s) => s.status === statusFilter);

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (s) => s.title.toLowerCase().includes(q) || s.description.toLowerCase().includes(q)
      );
    }

    const common = getSurveyComparator(sortBy, sortDir);

    if (common) {
      result = [...result].sort(common);
    } else {
      const mul = sortDir === 'asc' ? 1 : -1;

      result = [...result].sort((a, b) => {
        switch (sortBy) {
          case 'responses':
            return mul * (a.responseCount - b.responseCount);
          case 'lastResponse': {
            const ta = a.lastResponseAt ? new Date(a.lastResponseAt).getTime() : 0;
            const tb = b.lastResponseAt ? new Date(b.lastResponseAt).getTime() : 0;

            return mul * (ta - tb) || a.title.localeCompare(b.title);
          }

          case 'activity': {
            const sumA = a.recentActivity.reduce((s, n) => s + n, 0);
            const sumB = b.recentActivity.reduce((s, n) => s + n, 0);

            return mul * (sumA - sumB) || a.title.localeCompare(b.title);
          }

          default:
            return 0;
        }
      });
    }

    return result;
  }, [surveys, statusFilter, searchQuery, sortBy, sortDir]);

  const isFiltered = statusFilter !== 'all';

  const handleSortByChange = (key: SurveySortBy) => {
    setSortBy(key);
    setSortDir(getDefaultSortDir(key));
  };

  const handleSortByColumn = (key: SurveySortBy) => {
    if (sortBy === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      handleSortByChange(key);
    }
  };

  const handleStatusChange = (surveyId: string, action: string) => {
    const newStatus = STATUS_TRANSITIONS[action] as SurveyStatus | null | undefined;

    if (newStatus === undefined) {
      return;
    }

    // Close sidebar when the survey is removed from the current view (delete or archive)
    if ((newStatus === null || newStatus === 'archived') && selectedId === surveyId) {
      setSelected(null);
    }

    setSurveys((prev) => {
      if (newStatus === null) {
        return prev.filter((s) => s.id !== surveyId);
      }

      return prev.map((s) =>
        s.id === surveyId ? { ...s, status: newStatus, updatedAt: new Date().toISOString() } : s
      );
    });
  };

  return (
    <div className="space-y-4">
      {/* KPI summary */}
      {kpiStatuses.length > 0 && (
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-x-4 gap-y-1">
          <div className="text-muted-foreground flex min-w-0 flex-wrap items-center gap-x-3 text-xs">
            {/* All total */}
            <span>
              <span className={cn('text-base font-semibold tabular-nums', STATUS_KPI_COLOR.all)}>
                {statusCounts.all}
              </span>
              <span className="ml-1">{t('surveys.dashboard.summary.totalLabel')}</span>
            </span>

            <span className="text-border" aria-hidden>
              /
            </span>

            {/* Per-status breakdown */}
            {kpiStatuses.map((status, i) => (
              <span key={status} className="flex shrink-0 items-center gap-x-3">
                {i > 0 && (
                  <span className="text-border" aria-hidden>
                    /
                  </span>
                )}
                <span>
                  <span
                    className={cn('text-base font-semibold tabular-nums', STATUS_KPI_COLOR[status])}
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
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => router.refresh()}
              aria-label={t('surveys.dashboard.refresh')}
              title={t('surveys.dashboard.refresh')}
            >
              <RefreshCw className="size-3" aria-hidden />
            </Button>
          </div>
        </div>
      )}

      {/* Toolbar */}
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

      {/* List content */}
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
              isSelected={selectedId === survey.id}
              onSelect={setSelected}
              onStatusChange={handleStatusChange}
              variant="card"
            />
          ))}
        </div>
      )}

      {/* Detail sheet */}
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
};
