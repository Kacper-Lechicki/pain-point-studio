'use client';

import { useMemo, useState } from 'react';

import { ClipboardList, MousePointerClick } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { UserSurvey } from '@/features/surveys/actions/get-user-surveys';
import { useSurveySelection } from '@/features/surveys/hooks/use-survey-selection';
import { getDefaultSortDir, getSurveyComparator } from '@/features/surveys/lib/sort-helpers';
import type { SurveyStatus } from '@/features/surveys/types';
import { useBreakpoint } from '@/hooks/common/use-breakpoint';

import { SortableTableHeader } from './sortable-table-header';
import { SurveyDetailSheet } from './survey-detail-sheet';
import { SurveyListRow } from './survey-list-row';
import {
  SurveyListToolbar,
  type SurveySortBy,
  type SurveySortDir,
  type SurveyStatusFilter,
} from './survey-list-toolbar';

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
  const t = useTranslations('surveys.dashboard');
  const isMd = useBreakpoint('md');
  const [surveys, setSurveys] = useState(initialSurveys);
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
      pending: 0,
      closed: 0,
      cancelled: 0,
    };

    for (const s of surveys) {
      if (s.status !== 'archived' && s.status in counts) {
        counts[s.status as SurveyStatusFilter]++;
      }
    }

    counts.all = counts.active + counts.draft + counts.pending + counts.closed + counts.cancelled;

    return counts;
  }, [surveys]);

  const kpiSummary = useMemo(() => {
    const activeCount = surveys.filter((s) => s.status === 'active').length;
    const totalResponses = surveys.reduce((sum, s) => sum + s.completedCount, 0);

    return {
      surveyCount: surveys.length,
      activeCount,
      totalResponses,
    };
  }, [surveys]);

  const filteredSurveys = useMemo(() => {
    let result =
      statusFilter === 'all' ? surveys : surveys.filter((s) => s.status === statusFilter);

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

    setSurveys((prev) => {
      if (newStatus === null) {
        if (selectedId === surveyId) {
          setSelected(null);
        }

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
      {kpiSummary.surveyCount > 0 && (
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-x-4 gap-y-1">
          <div className="text-muted-foreground flex min-w-0 flex-wrap items-center gap-x-3 text-xs">
            <span className="shrink-0">
              <span className="text-foreground text-base font-semibold tabular-nums">
                {kpiSummary.surveyCount}
              </span>
              <span className="ml-1">{t('summary.totalLabel')}</span>
            </span>
            <span className="text-border shrink-0" aria-hidden>
              /
            </span>
            <span className="shrink-0">
              <span className="text-base font-semibold text-emerald-600 tabular-nums dark:text-emerald-400">
                {kpiSummary.activeCount}
              </span>
              <span className="ml-1">{t('summary.activeLabel')}</span>
            </span>
            <span className="text-border shrink-0" aria-hidden>
              /
            </span>
            <span className="shrink-0">
              <span className="text-foreground text-base font-semibold tabular-nums">
                {kpiSummary.totalResponses}
              </span>
              <span className="ml-1">{t('summary.responsesLabel')}</span>
            </span>
          </div>
          <span className="text-muted-foreground hidden shrink-0 items-center gap-1 text-[11px] md:flex">
            <MousePointerClick className="size-3" aria-hidden />
            {t('clickHint')}
          </span>
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
        hasSortableColumns={isMd}
      />

      {/* List content */}
      {filteredSurveys.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title={
            searchQuery.trim()
              ? t('emptySearch.title', { query: searchQuery })
              : t('emptyFilter.title')
          }
          description={
            searchQuery.trim() ? t('emptySearch.description') : t('emptyFilter.description')
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
                {t('clearFilters')}
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
                  label={t('table.title')}
                  className="w-[30%]"
                />
                <SortableTableHeader
                  sortKey="status"
                  currentSortKey={sortBy}
                  sortDir={sortDir}
                  onSort={handleSortByColumn}
                  label={t('table.status')}
                  className="border-border/30 border-l"
                  centered
                />
                <SortableTableHeader
                  sortKey="questions"
                  currentSortKey={sortBy}
                  sortDir={sortDir}
                  onSort={handleSortByColumn}
                  label={t('table.questions')}
                  className="border-border/30 border-l"
                />
                <SortableTableHeader
                  sortKey="responses"
                  currentSortKey={sortBy}
                  sortDir={sortDir}
                  onSort={handleSortByColumn}
                  label={t('table.responses')}
                  className="border-border/30 border-l"
                />
                <SortableTableHeader
                  sortKey="lastResponse"
                  currentSortKey={sortBy}
                  sortDir={sortDir}
                  onSort={handleSortByColumn}
                  label={t('table.lastResponse')}
                  className="border-border/30 hidden border-l lg:table-cell"
                />
                <SortableTableHeader
                  sortKey="activity"
                  currentSortKey={sortBy}
                  sortDir={sortDir}
                  onSort={handleSortByColumn}
                  label={t('table.activity')}
                  className="border-border/30 hidden border-l xl:table-cell"
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
        detailsLabel={t('detailPanel.detailsLabel')}
      />
    </div>
  );
};
