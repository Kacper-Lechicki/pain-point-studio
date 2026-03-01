'use client';

import { useCallback, useEffect, useState } from 'react';

import { useRouter } from 'next/navigation';

import { FolderKanban } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { ListPagination } from '@/components/ui/list-pagination';
import type { ProjectWithMetrics } from '@/features/projects/actions/get-projects';
import type { ProjectsListExtrasMap } from '@/features/projects/actions/get-projects-list-extras';
import { ProjectCardRow } from '@/features/projects/components/project-card-row';
import { ProjectListKpi } from '@/features/projects/components/project-list-kpi';
import { ProjectListTable } from '@/features/projects/components/project-list-table';
import { ProjectListToolbar } from '@/features/projects/components/project-list-toolbar';
import { useProjectListActions } from '@/features/projects/hooks/use-project-list-actions';
import { useProjectListState } from '@/features/projects/hooks/use-project-list-state';
import { getProjectDetailUrl } from '@/features/projects/lib/project-urls';

import { EditProjectDialog } from './edit-project-dialog';

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
          onDelete={(p) => setConfirmAction({ type: 'delete', project: p })}
        />
      ) : (
        <div className="flex min-w-0 flex-col gap-2" role="list">
          {paginatedProjects.map((project) => (
            <ProjectCardRow
              key={project.id}
              project={project}
              extras={extras?.[project.id]}
              onSelect={handleSelect}
              onDelete={(p) => setConfirmAction({ type: 'delete', project: p })}
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
    </div>
  );
}
