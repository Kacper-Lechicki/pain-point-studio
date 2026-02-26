'use client';

import { useEffect, useState } from 'react';

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
import { useRealtimeSurveyList } from '@/features/surveys/hooks/use-realtime-survey-list';
import {
  SURVEY_LIST_COMPARATOR,
  useSurveyListFilters,
} from '@/features/surveys/hooks/use-survey-list-filters';
import { useSurveyListState } from '@/features/surveys/hooks/use-survey-list-state';
import { useSurveySelection } from '@/features/surveys/hooks/use-survey-selection';
import { applyOptimisticStatusChange } from '@/features/surveys/lib/status-change-handler';
import { useRefresh } from '@/hooks/common/use-refresh';

import { SurveyListToolbar, type SurveySortBy } from './survey-list-toolbar';

interface SurveyListProps {
  initialSurveys: UserSurvey[];
  /** When set, the list runs in project context (hides project filter, shows archived status). */
  projectId?: string | undefined;
  /** Callback to open the "create survey" dialog (rendered by the parent). */
  onCreateSurvey?: (() => void) | undefined;
}

export const SurveyList = ({ initialSurveys, projectId }: SurveyListProps) => {
  const t = useTranslations();
  const { isRefreshing, refresh, lastSyncedAt, markSynced } = useRefresh();
  const [surveys, setSurveys] = useState(initialSurveys);

  useEffect(() => {
    setSurveys(initialSurveys);
  }, [initialSurveys]);

  const hasActiveSurveys = surveys.some((s) => s.status === 'active');
  const { isConnected: isRealtimeConnected } = useRealtimeSurveyList(markSynced, hasActiveSurveys);

  const isProjectContext = !!projectId;

  const {
    statusFilter,
    setStatusFilter,
    projectFilter,
    setProjectFilter,
    preFilter,
    statusCounts,
    projectOptions,
    kpiStatuses,
    isFiltered,
  } = useSurveyListFilters(surveys, { projectContext: isProjectContext });

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
    paginatedSurveys,
    pagination,
  } = useSurveyListState<SurveySortBy>({
    surveys,
    storageKey: projectId ? `surveyList:${projectId}` : 'surveyList',
    defaultSortBy: 'updated',
    preFilter,
    customComparator: SURVEY_LIST_COMPARATOR,
  });

  const { selectedId, selectedSurvey, questions, showSheet, setSelected } =
    useSurveySelection(surveys);

  const handleStatusChange = (surveyId: string, action: string) => {
    // In project context, archived surveys stay visible — don't deselect on archive.
    const deselectStatuses = isProjectContext ? [] : ['archived'];
    const { shouldDeselect, updatedSurveys } = applyOptimisticStatusChange(
      surveys,
      surveyId,
      action,
      deselectStatuses
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
        projectFilter={projectFilter}
        onProjectFilterChange={setProjectFilter}
        projectOptions={projectOptions}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        sortBy={sortBy}
        sortDir={sortDir}
        onSortByChange={handleSortByChange}
        onSortDirChange={setSortDir}
        statusCounts={statusCounts}
        hideProjectFilter={isProjectContext}
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
                  setProjectFilter([]);
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
