'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { ClipboardList } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { ListPagination } from '@/components/ui/list-pagination';
import type { UserSurvey } from '@/features/surveys/actions/get-user-surveys';
import { SurveyDetailSheet } from '@/features/surveys/components/dashboard/survey-detail-sheet';
import { SurveyListKpi } from '@/features/surveys/components/dashboard/survey-list-kpi';
import { SurveyListRow } from '@/features/surveys/components/dashboard/survey-list-row';
import { SurveyListTable } from '@/features/surveys/components/dashboard/survey-list-table';
import { SURVEY_CATEGORIES } from '@/features/surveys/config/survey-categories';
import { deriveSurveyFlags } from '@/features/surveys/config/survey-status';
import {
  useRealtimeSurveyList,
  useSurveyListState,
  useSurveySelection,
} from '@/features/surveys/hooks';
import { applyOptimisticStatusChange } from '@/features/surveys/lib/status-change-handler';
import { useRefresh } from '@/hooks/common/use-refresh';
import { useSessionState } from '@/hooks/common/use-session-state';

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
  const { isRefreshing, refresh, lastSyncedAt, markSynced } = useRefresh();
  const [surveys, setSurveys] = useState(initialSurveys);

  const [statusFilter, setStatusFilter] = useSessionState<SurveyStatusFilter[]>(
    'surveyList:status',
    []
  );

  useEffect(() => {
    setSurveys(initialSurveys);
  }, [initialSurveys]);

  const hasActiveSurveys = surveys.some((s) => s.status === 'active');
  const { isConnected: isRealtimeConnected } = useRealtimeSurveyList(markSynced, hasActiveSurveys);

  const preFilter = useCallback(
    (s: UserSurvey) =>
      PRE_FILTER(s) &&
      (statusFilter.length === 0 || statusFilter.includes(s.status as SurveyStatusFilter)),
    [statusFilter]
  );

  const {
    now,
    isMd,
    searchQuery,
    setSearchQuery,
    categoryFilter,
    setCategoryFilter,
    sortBy,
    sortDir,
    setSortDir,
    handleSortByChange,
    handleSortByColumn,
    filteredSurveys,
    paginatedSurveys,
    pagination,
  } = useSurveyListState<SurveySortBy>({
    surveys,
    storageKey: 'surveyList',
    defaultSortBy: 'updated',
    preFilter,
    customComparator: CUSTOM_COMPARATOR,
  });

  const { selectedId, selectedSurvey, questions, showSheet, setSelected } =
    useSurveySelection(surveys);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {
      active: 0,
      draft: 0,
      completed: 0,
      cancelled: 0,
    };

    for (const s of surveys) {
      if (!deriveSurveyFlags(s.status).isArchived && s.status in counts) {
        const current = counts[s.status];

        if (current !== undefined) {
          counts[s.status] = current + 1;
        }
      }
    }

    return counts;
  }, [surveys]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};

    for (const cat of SURVEY_CATEGORIES) {
      counts[cat.value] = 0;
    }

    for (const s of surveys) {
      if (!deriveSurveyFlags(s.status).isArchived) {
        if (statusFilter.length === 0 || statusFilter.includes(s.status as SurveyStatusFilter)) {
          const current = counts[s.category];

          if (current !== undefined) {
            counts[s.category] = current + 1;
          }
        }
      }
    }

    return counts;
  }, [surveys, statusFilter]);

  const kpiStatuses = useMemo(() => {
    const order: SurveyStatusFilter[] = ['active', 'draft', 'completed', 'cancelled'];

    return order.filter((s) => (statusCounts[s] ?? 0) > 0);
  }, [statusCounts]);

  const isFiltered = statusFilter.length > 0 || categoryFilter.length > 0;

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
        hasActiveSurveys={hasActiveSurveys}
        isRefreshing={isRefreshing}
        isRealtimeConnected={isRealtimeConnected}
        lastSyncedAt={lastSyncedAt}
        onRefresh={refresh}
      />

      <SurveyListToolbar
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        categoryFilter={categoryFilter}
        onCategoryFilterChange={setCategoryFilter}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        sortBy={sortBy}
        sortDir={sortDir}
        onSortByChange={handleSortByChange}
        onSortDirChange={setSortDir}
        statusCounts={statusCounts}
        categoryCounts={categoryCounts}
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
                  setStatusFilter([]);
                  setCategoryFilter([]);
                }}
              >
                {t('surveys.dashboard.clearFilters')}
              </Button>
            )
          }
        />
      ) : isMd ? (
        <SurveyListTable
          surveys={paginatedSurveys}
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
          {paginatedSurveys.map((survey: UserSurvey) => (
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

      {filteredSurveys.length > 0 && (
        <ListPagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          perPage={pagination.perPage}
          totalItems={pagination.totalItems}
          startIndex={pagination.startIndex}
          endIndex={pagination.endIndex}
          canGoNext={pagination.canGoNext}
          canGoPrev={pagination.canGoPrev}
          onPageChange={pagination.goToPage}
          onPerPageChange={pagination.setPerPage}
          onNextPage={pagination.nextPage}
          onPrevPage={pagination.prevPage}
        />
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
