'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { ClipboardList } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import type { UserSurvey } from '@/features/surveys/actions/get-user-surveys';
import { deriveSurveyFlags } from '@/features/surveys/config/survey-status';
import { useRealtimeSurveyList } from '@/features/surveys/hooks/use-realtime-survey-list';
import { useSurveyListState } from '@/features/surveys/hooks/use-survey-list-state';
import { useSurveySelection } from '@/features/surveys/hooks/use-survey-selection';
import { applyOptimisticStatusChange } from '@/features/surveys/lib/status-change-handler';
import { useRefresh } from '@/hooks/common/use-refresh';

import { SurveyDetailSheet } from './survey-detail-sheet';
import { SurveyListKpi } from './survey-list-kpi';
import { SurveyListRow } from './survey-list-row';
import { SurveyListTable } from './survey-list-table';
import {
  SurveyListToolbar,
  type SurveySortBy,
  type SurveyStatusFilter,
} from './survey-list-toolbar';

const PRE_FILTER = (s: UserSurvey) => !deriveSurveyFlags(s.status).isArchived;

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
      if (!deriveSurveyFlags(s.status).isArchived && s.status in counts) {
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
      <SurveyListKpi
        statusCounts={statusCounts}
        kpiStatuses={kpiStatuses}
        isRefreshing={isRefreshing}
        isRealtimeConnected={isRealtimeConnected}
        onRefresh={refresh}
      />

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
        <SurveyListTable
          surveys={filteredSurveys}
          selectedId={selectedId}
          sortBy={sortBy}
          sortDir={sortDir}
          now={now}
          onSortByColumn={handleSortByColumn}
          onSelect={setSelected}
          onStatusChange={handleStatusChange}
        />
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
