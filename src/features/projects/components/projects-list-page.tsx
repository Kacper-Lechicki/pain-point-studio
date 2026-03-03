'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { useRouter } from 'next/navigation';

import { FolderKanban } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { ListPagination } from '@/components/ui/list-pagination';
import { bulkChangeProjectStatus } from '@/features/projects/actions/bulk-change-project-status';
import type { ProjectWithMetrics } from '@/features/projects/actions/get-projects';
import type { ProjectsListExtrasMap } from '@/features/projects/actions/get-projects-list-extras';
import { BulkActionBar } from '@/features/projects/components/bulk-action-bar';
import { EditProjectDialog } from '@/features/projects/components/edit-project-dialog';
import { ProjectCardRow } from '@/features/projects/components/project-card-row';
import { ProjectListKpi } from '@/features/projects/components/project-list-kpi';
import { ProjectListTable } from '@/features/projects/components/project-list-table';
import { ProjectListToolbar } from '@/features/projects/components/project-list-toolbar';
import type { ProjectAction } from '@/features/projects/config/status';
import { useProjectBulkSelection } from '@/features/projects/hooks/use-project-bulk-selection';
import { useProjectListActions } from '@/features/projects/hooks/use-project-list-actions';
import { useProjectListState } from '@/features/projects/hooks/use-project-list-state';
import { getProjectConfirmDialogProps } from '@/features/projects/lib/project-confirm-props';
import { getProjectDetailUrl } from '@/features/projects/lib/project-urls';
import { useFormAction } from '@/hooks/common/use-form-action';
import type { MessageKey } from '@/i18n/types';

interface ProjectsListPageProps {
  projects: ProjectWithMetrics[];
  extras?: ProjectsListExtrasMap | null | undefined;
}

export function ProjectsListPage({ projects, extras }: ProjectsListPageProps) {
  const t = useTranslations();
  const router = useRouter();

  const [localProjects, setLocalProjects] = useState(projects);

  useEffect(() => {
    setLocalProjects(projects);
  }, [projects]);

  const {
    isMd,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    sortBy,
    sortDir,
    setSortDir,
    handleSortByChange,
    handleSortByColumn,
    filteredProjects,
    paginatedProjects,
    pagination,
    isFiltered,
    statusCounts,
    kpiStatuses,
  } = useProjectListState(localProjects, extras);

  const {
    editProject,
    setEditProject,
    confirmAction,
    setConfirmAction,
    handleEditSuccess,
    handleConfirm,
    confirmDialogProps,
  } = useProjectListActions({
    localProjects,
    setLocalProjects,
    selectedId: null,
    setSelected: () => {},
  });

  const {
    selectedIds,
    toggleSelect,
    selectAll,
    clearSelection,
    availableBulkActions,
    selectionCount,
  } = useProjectBulkSelection(localProjects);

  type BulkAction = Exclude<ProjectAction, 'permanentDelete'>;
  const [bulkConfirmAction, setBulkConfirmAction] = useState<BulkAction | null>(null);
  const bulkAction = useFormAction({
    unexpectedErrorMessage: 'projects.errors.unexpected' as MessageKey,
  });

  const bulkConfirmDialogProps = useMemo(() => {
    if (!bulkConfirmAction) {
      return null;
    }

    return getProjectConfirmDialogProps(bulkConfirmAction, t);
  }, [bulkConfirmAction, t]);

  const handleBulkConfirm = useCallback(async () => {
    if (!bulkConfirmAction || selectedIds.size === 0) {
      return;
    }

    setBulkConfirmAction(null);
    const ids = [...selectedIds];

    const result = await bulkAction.execute(bulkChangeProjectStatus, {
      projectIds: ids,
      action: bulkConfirmAction,
    });

    if (result && !result.error) {
      const { toast } = await import('sonner');
      const failed = result.data?.failed ?? 0;

      if (failed > 0) {
        toast.warning(t('projects.list.bulk.partialSuccess', { failed }));
      } else {
        toast.success(
          t('projects.list.bulk.selected', { count: ids.length }) +
            ' — ' +
            t(`projects.list.actions.${bulkConfirmAction}` as MessageKey)
        );
      }

      clearSelection();
      router.refresh();
    }
  }, [bulkConfirmAction, selectedIds, bulkAction, t, clearSelection, router]);

  const handleSelect = useCallback(
    (projectId: string) => {
      router.push(getProjectDetailUrl(projectId));
    },
    [router]
  );

  return (
    <div className="space-y-4">
      <ProjectListKpi statusCounts={statusCounts} kpiStatuses={kpiStatuses} />

      <ProjectListToolbar
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

      {selectionCount > 0 && (
        <BulkActionBar
          count={selectionCount}
          availableActions={availableBulkActions}
          onAction={(action) => setBulkConfirmAction(action as BulkAction)}
          onClear={clearSelection}
          onSelectAll={() => selectAll(paginatedProjects)}
          allOnPageSelected={paginatedProjects.every((p) => selectedIds.has(p.id))}
        />
      )}

      {filteredProjects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title={
            searchQuery.trim()
              ? t('projects.list.emptySearch.title', { query: searchQuery })
              : t('projects.list.emptyFilter.title')
          }
          description={
            searchQuery.trim()
              ? t('projects.list.emptySearch.description')
              : t('projects.list.emptyFilter.description')
          }
          action={
            (searchQuery.trim() || isFiltered) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter([]);
                }}
              >
                {t('projects.list.clearFilters')}
              </Button>
            )
          }
        />
      ) : isMd ? (
        <ProjectListTable
          projects={paginatedProjects}
          extras={extras}
          sortBy={sortBy}
          sortDir={sortDir}
          onSortByColumn={handleSortByColumn}
          onSelect={handleSelect}
          onAction={(p, action) => setConfirmAction({ action, project: p })}
          selectedIds={selectedIds}
          onToggleSelect={toggleSelect}
          onSelectAll={selectAll}
          onClearSelection={clearSelection}
        />
      ) : (
        <div className="flex min-w-0 flex-col gap-2" role="list">
          {paginatedProjects.map((project) => (
            <ProjectCardRow
              key={project.id}
              project={project}
              extras={extras?.[project.id]}
              onSelect={handleSelect}
              onAction={(p, action) => setConfirmAction({ action, project: p })}
              isSelected={selectedIds.has(project.id)}
              onToggleSelect={toggleSelect}
            />
          ))}
        </div>
      )}

      {filteredProjects.length > 0 && (
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

      {editProject && (
        <EditProjectDialog
          open={!!editProject}
          onOpenChange={(open) => {
            if (!open) {
              setEditProject(null);
            }
          }}
          project={editProject}
          onSuccess={handleEditSuccess}
        />
      )}

      {confirmDialogProps && (
        <ConfirmDialog
          open={!!confirmAction}
          onOpenChange={(open) => {
            if (!open) {
              setConfirmAction(null);
            }
          }}
          onConfirm={handleConfirm}
          title={confirmDialogProps.title}
          description={confirmDialogProps.description}
          confirmLabel={confirmDialogProps.confirmLabel}
          variant={confirmDialogProps.variant}
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
}
