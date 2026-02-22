'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { useRouter } from 'next/navigation';

import { FolderKanban } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { ListPagination } from '@/components/ui/list-pagination';
import { archiveProject } from '@/features/projects/actions/archive-project';
import { deleteProject } from '@/features/projects/actions/delete-project';
import type { ProjectWithMetrics } from '@/features/projects/actions/get-projects';
import { ProjectCardRow } from '@/features/projects/components/project-card-row';
import { ProjectListKpi } from '@/features/projects/components/project-list-kpi';
import { ProjectListTable } from '@/features/projects/components/project-list-table';
import {
  ProjectListToolbar,
  type ProjectStatusFilter,
} from '@/features/projects/components/project-list-toolbar';
import { PROJECT_CONTEXTS_CONFIG } from '@/features/projects/config/contexts';
import { useProjectListState } from '@/features/projects/hooks/use-project-list-state';
import { getProjectDetailUrl } from '@/features/projects/lib/project-urls';
import { useFormAction } from '@/hooks/common/use-form-action';
import type { MessageKey } from '@/i18n/types';

import { EditProjectDialog } from './edit-project-dialog';

type ConfirmAction = {
  type: 'archive' | 'delete';
  project: ProjectWithMetrics;
};

interface ProjectsListPageProps {
  projects: ProjectWithMetrics[];
}

export function ProjectsListPage({ projects }: ProjectsListPageProps) {
  const t = useTranslations();
  const router = useRouter();

  const [localProjects, setLocalProjects] = useState(projects);

  useEffect(() => {
    setLocalProjects(projects);
  }, [projects]);

  const {
    now,
    isMd,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    contextFilter,
    setContextFilter,
    sortBy,
    sortDir,
    setSortDir,
    handleSortByChange,
    handleSortByColumn,
    filteredProjects,
    paginatedProjects,
    pagination,
    isFiltered,
  } = useProjectListState(localProjects);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editProject, setEditProject] = useState<ProjectWithMetrics | null>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);

  const archiveAction = useFormAction({
    unexpectedErrorMessage: 'projects.errors.unexpected' as MessageKey,
  });
  const deleteAction = useFormAction({
    unexpectedErrorMessage: 'projects.errors.unexpected' as MessageKey,
  });

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { active: 0, archived: 0 };

    for (const p of localProjects) {
      if (p.status in counts) {
        counts[p.status] = (counts[p.status] ?? 0) + 1;
      }
    }

    return counts;
  }, [localProjects]);

  const contextCounts = useMemo(() => {
    const counts: Record<string, number> = {};

    for (const key of Object.keys(PROJECT_CONTEXTS_CONFIG)) {
      counts[key] = 0;
    }

    for (const p of localProjects) {
      if (statusFilter.length === 0 || statusFilter.includes(p.status as ProjectStatusFilter)) {
        counts[p.context] = (counts[p.context] ?? 0) + 1;
      }
    }

    return counts;
  }, [localProjects, statusFilter]);

  const kpiStatuses = useMemo(() => {
    const order: ProjectStatusFilter[] = ['active', 'archived'];

    return order.filter((s) => (statusCounts[s] ?? 0) > 0);
  }, [statusCounts]);

  const handleSelect = useCallback(
    (projectId: string) => {
      setSelectedId((prev) => (prev === projectId ? null : projectId));
      router.push(getProjectDetailUrl(projectId));
    },
    [router]
  );

  const handleEditSuccess = (data: { name: string; description: string | undefined }) => {
    if (!editProject) {
      return;
    }

    setLocalProjects((prev) =>
      prev.map((p) =>
        p.id === editProject.id
          ? {
              ...p,
              name: data.name,
              description: data.description ?? null,
              updated_at: new Date().toISOString(),
            }
          : p
      )
    );
  };

  const handleConfirm = async () => {
    if (!confirmAction) {
      return;
    }

    const { type, project } = confirmAction;

    if (type === 'archive') {
      const isArchived = project.status === 'archived';
      const successMsg = (
        isArchived ? 'projects.list.restoreSuccess' : 'projects.list.archiveSuccess'
      ) as MessageKey;

      setLocalProjects((prev) =>
        prev.map((p) =>
          p.id === project.id
            ? {
                ...p,
                status: (isArchived ? 'active' : 'archived') as ProjectWithMetrics['status'],
                archived_at: isArchived ? null : new Date().toISOString(),
                updated_at: new Date().toISOString(),
              }
            : p
        )
      );
      setConfirmAction(null);

      const result = await archiveAction.execute(archiveProject, { projectId: project.id });

      if (result && !result.error) {
        const { toast } = await import('sonner');
        toast.success(t(successMsg));
      } else {
        setLocalProjects((prev) =>
          prev.map((p) =>
            p.id === project.id
              ? {
                  ...p,
                  status: project.status,
                  archived_at: project.archived_at,
                  updated_at: project.updated_at,
                }
              : p
          )
        );
      }
    } else {
      setLocalProjects((prev) => prev.filter((p) => p.id !== project.id));
      setConfirmAction(null);

      if (selectedId === project.id) {
        setSelectedId(null);
      }

      const result = await deleteAction.execute(deleteProject, { projectId: project.id });

      if (result && !result.error) {
        const { toast } = await import('sonner');
        toast.success(t('projects.list.deleteSuccess' as MessageKey));
      } else {
        setLocalProjects((prev) => [...prev, project]);
      }
    }
  };

  const confirmDialogProps = useMemo(() => {
    if (!confirmAction) {
      return null;
    }

    const { type, project } = confirmAction;
    const isArchived = project.status === 'archived';

    if (type === 'archive') {
      return {
        title: t(
          isArchived ? 'projects.list.confirm.restoreTitle' : 'projects.list.confirm.archiveTitle'
        ),
        description: t(
          isArchived
            ? 'projects.list.confirm.restoreDescription'
            : 'projects.list.confirm.archiveDescription'
        ),
        confirmLabel: t(
          isArchived ? 'projects.list.confirm.restoreAction' : 'projects.list.confirm.archiveAction'
        ),
        variant: 'default' as const,
      };
    }

    return {
      title: t('projects.list.confirm.deleteTitle'),
      description: t('projects.list.confirm.deleteDescription'),
      confirmLabel: t('projects.list.confirm.deleteAction'),
      variant: 'destructive' as const,
    };
  }, [confirmAction, t]);

  return (
    <div className="space-y-4">
      <ProjectListKpi statusCounts={statusCounts} kpiStatuses={kpiStatuses} />

      <ProjectListToolbar
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        contextFilter={contextFilter}
        onContextFilterChange={setContextFilter}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        sortBy={sortBy}
        sortDir={sortDir}
        onSortByChange={handleSortByChange}
        onSortDirChange={setSortDir}
        statusCounts={statusCounts}
        contextCounts={contextCounts}
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
                  setContextFilter([]);
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
          selectedId={selectedId}
          sortBy={sortBy}
          sortDir={sortDir}
          now={now}
          onSortByColumn={handleSortByColumn}
          onSelect={handleSelect}
          onEdit={setEditProject}
          onArchive={(p) => setConfirmAction({ type: 'archive', project: p })}
          onDelete={(p) => setConfirmAction({ type: 'delete', project: p })}
        />
      ) : (
        <div className="flex min-w-0 flex-col gap-2" role="list">
          {paginatedProjects.map((project) => (
            <ProjectCardRow
              key={project.id}
              project={project}
              isSelected={selectedId === project.id}
              now={now}
              onSelect={handleSelect}
              onEdit={setEditProject}
              onArchive={(p) => setConfirmAction({ type: 'archive', project: p })}
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
