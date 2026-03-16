'use client';

import { useEffect, useState } from 'react';

import { useRouter } from 'next/navigation';

import { ClipboardList } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { ListPagination } from '@/components/ui/list-pagination';
import { bulkChangeSurveyStatus } from '@/features/surveys/actions/bulk-change-survey-status';
import { SurveyBulkActionBar } from '@/features/surveys/components/dashboard/survey-bulk-action-bar';
import { SurveyDetailSheet } from '@/features/surveys/components/dashboard/survey-detail-sheet';
import { SurveyListKpi } from '@/features/surveys/components/dashboard/survey-list-kpi';
import { SurveyListRow } from '@/features/surveys/components/dashboard/survey-list-row';
import { SurveyListTable } from '@/features/surveys/components/dashboard/survey-list-table';
import {
  SurveyListToolbar,
  type SurveySortBy,
} from '@/features/surveys/components/dashboard/survey-list-toolbar';
import { SURVEY_ACTION_UI } from '@/features/surveys/config/survey-status';
import { useRealtimeSurveyList } from '@/features/surveys/hooks/use-realtime-survey-list';
import {
  type BulkSurveyAction,
  useSurveyBulkSelection,
} from '@/features/surveys/hooks/use-survey-bulk-selection';
import {
  SURVEY_LIST_COMPARATOR,
  useSurveyListFilters,
} from '@/features/surveys/hooks/use-survey-list-filters';
import { useSurveyListState } from '@/features/surveys/hooks/use-survey-list-state';
import { useSurveySelection } from '@/features/surveys/hooks/use-survey-selection';
import { applyOptimisticStatusChange } from '@/features/surveys/lib/status-change-handler';
import type { UserSurvey } from '@/features/surveys/types';
import { useFormAction } from '@/hooks/common/use-form-action';
import { useRefresh } from '@/hooks/common/use-refresh';
import type { MessageKey } from '@/i18n/types';
import { getSurveyDetailUrl } from '@/lib/common/urls/survey-urls';

interface SurveyListProps {
  initialSurveys: UserSurvey[];
  projectId?: string | undefined;
  onCreateSurvey?: (() => void) | undefined;
  totalResponses?: number | undefined;
  responseLimit?: number | undefined;
}

export const SurveyList = ({
  initialSurveys,
  projectId,
  onCreateSurvey,
  totalResponses,
  responseLimit,
}: SurveyListProps) => {
  const t = useTranslations();
  const router = useRouter();
  const { isRefreshing, refresh, lastSyncedAt, markSynced } = useRefresh();
  const [surveys, setSurveys] = useState(initialSurveys);

  useEffect(() => {
    setSurveys(initialSurveys);
  }, [initialSurveys]);

  const isProjectContext = !!projectId;

  const hasActiveSurveys = surveys.some((s) => s.status === 'active');
  const { isConnected: isRealtimeConnected } = useRealtimeSurveyList(
    markSynced,
    hasActiveSurveys && !isProjectContext
  );

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
    layoutBreakpoint: isProjectContext ? 'lg' : undefined,
    preFilter,
    customComparator: SURVEY_LIST_COMPARATOR,
  });

  const { selectedId, selectedSurvey, questions, showSheet, setSelected } =
    useSurveySelection(surveys);

  const handleNavigate = (surveyId: string) => router.push(getSurveyDetailUrl(surveyId));

  const onSelect = isProjectContext ? handleNavigate : setSelected;

  const handleStatusChange = (surveyId: string, action: string) => {
    const deselectStatuses = isProjectContext ? ['trashed'] : ['archived', 'trashed'];
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

  const {
    selectedIds,
    toggleSelect,
    selectAll,
    clearSelection,
    availableBulkActions,
    selectionCount,
  } = useSurveyBulkSelection(surveys);

  const [bulkConfirmAction, setBulkConfirmAction] = useState<BulkSurveyAction | null>(null);
  const bulkAction = useFormAction({
    unexpectedErrorMessage: 'surveys.errors.unexpected' as MessageKey,
  });

  const bulkConfirmDialogProps = (() => {
    if (!bulkConfirmAction) {
      return null;
    }

    const config = SURVEY_ACTION_UI[bulkConfirmAction].confirm;

    if (!config) {
      return null;
    }

    return {
      title: t(`surveys.dashboard.${config.titleKey}` as MessageKey),
      description: t(`surveys.dashboard.${config.descriptionKey}` as MessageKey),
      confirmLabel: t(`surveys.dashboard.actions.${bulkConfirmAction}` as MessageKey),
      variant: config.variant,
    };
  })();

  async function handleBulkConfirm() {
    if (!bulkConfirmAction || selectedIds.size === 0) {
      return;
    }

    setBulkConfirmAction(null);
    const ids = [...selectedIds];

    const result = await bulkAction.execute(bulkChangeSurveyStatus, {
      surveyIds: ids,
      action: bulkConfirmAction,
    });

    if (result && !result.error) {
      const failed = result.data?.failed ?? 0;

      if (failed > 0) {
        const { toast } = await import('sonner');
        toast.warning(t('surveys.dashboard.bulk.partialSuccess', { failed }));
      }

      clearSelection();
      router.refresh();
    }
  }

  return (
    <div className="w-full min-w-0 space-y-4 overflow-x-hidden">
      <SurveyListKpi
        statusCounts={statusCounts}
        kpiStatuses={kpiStatuses}
        hasActiveSurveys={hasActiveSurveys}
        isRefreshing={isRefreshing}
        isRealtimeConnected={isRealtimeConnected}
        lastSyncedAt={lastSyncedAt}
        onRefresh={refresh}
        isProjectContext={isProjectContext}
        totalResponses={totalResponses}
        responseLimit={responseLimit}
        onCreateSurvey={onCreateSurvey}
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

      {selectionCount > 0 && (
        <SurveyBulkActionBar
          count={selectionCount}
          availableActions={availableBulkActions}
          onAction={setBulkConfirmAction}
          onClear={clearSelection}
          onSelectAll={() => selectAll(paginatedSurveys)}
          allOnPageSelected={paginatedSurveys.every((s) => selectedIds.has(s.id))}
        />
      )}

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
          selectedId={isProjectContext ? null : selectedId}
          sortBy={sortBy}
          sortDir={sortDir}
          now={now}
          onSortByColumn={handleSortByColumn}
          onSelect={onSelect}
          onStatusChange={handleStatusChange}
          isProjectContext={isProjectContext}
          selectedIds={selectedIds}
          onToggleBulkSelect={toggleSelect}
          onSelectAll={selectAll}
          onClearSelection={clearSelection}
        />
      ) : (
        <div className="flex min-w-0 flex-col gap-2 overflow-hidden" role="list">
          {paginatedSurveys.map((survey: UserSurvey) => (
            <SurveyListRow
              key={survey.id}
              survey={survey}
              now={now}
              isSelected={!isProjectContext && selectedId === survey.id}
              onSelect={onSelect}
              onStatusChange={handleStatusChange}
              variant="card"
              isProjectContext={isProjectContext}
              isBulkSelected={selectedIds.has(survey.id)}
              onToggleBulkSelect={toggleSelect}
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

      {!isProjectContext && (
        <SurveyDetailSheet
          open={showSheet}
          onClose={() => setSelected(null)}
          survey={selectedSurvey}
          questions={questions}
          now={now}
          onStatusChange={handleStatusChange}
          detailsLabel={t('surveys.dashboard.detailPanel.detailsLabel')}
        />
      )}

      {bulkConfirmDialogProps && (
        <ConfirmDialog
          open={!!bulkConfirmAction}
          onOpenChange={(open) => {
            if (!open) {
              setBulkConfirmAction(null);
            }
          }}
          onConfirm={handleBulkConfirm}
          title={bulkConfirmDialogProps.title}
          description={bulkConfirmDialogProps.description}
          confirmLabel={bulkConfirmDialogProps.confirmLabel}
          variant={bulkConfirmDialogProps.variant}
        />
      )}
    </div>
  );
};
