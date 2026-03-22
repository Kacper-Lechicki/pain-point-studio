'use client';

import { Archive, EllipsisVertical, Trash2, Trophy } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { RefreshRealtimeButton } from '@/components/ui/refresh-realtime-button';
import { StatusBadge } from '@/components/ui/status-badge';
import type { ProjectOwner } from '@/features/projects/actions/get-project';
import { ProjectAvatar } from '@/features/projects/components/project-avatar';
import { ProjectMetadata } from '@/features/projects/components/project-metadata';
import { ProjectStatusBadge } from '@/features/projects/components/project-status-badge';
import { ProjectStatusBanner } from '@/features/projects/components/project-status-banner';
import type { ProjectAction } from '@/features/projects/config/status';
import { PROJECT_ACTION_UI, getAvailableActions } from '@/features/projects/config/status';
import {
  isProjectArchived,
  isProjectCompleted,
  isProjectTrashed,
} from '@/features/projects/lib/project-helpers';
import type { Project, ProjectStatus } from '@/features/projects/types';
import type { MessageKey } from '@/i18n/types';

interface ProjectDetailHeaderProps {
  project: Project;
  owner?: ProjectOwner | null;
  lastResponseAt?: string | null;
  onAction: (action: ProjectAction) => void;
  isRefreshing?: boolean | undefined;
  isRealtimeConnected?: boolean | undefined;
  lastSyncedAt?: number | undefined;
  onRefresh?: (() => void) | undefined;
  hasActiveSurveys?: boolean | undefined;
}

export function ProjectDetailHeader({
  project,
  owner,
  onAction,
  lastResponseAt,
  isRefreshing,
  isRealtimeConnected,
  lastSyncedAt,
  onRefresh,
  hasActiveSurveys,
}: ProjectDetailHeaderProps) {
  const t = useTranslations();
  const actions = getAvailableActions(project.status as ProjectStatus);

  return (
    <div className="flex flex-col gap-4">
      {isProjectArchived(project) && (
        <ProjectStatusBanner
          icon={Archive}
          colorClass="bg-muted [&>svg]:text-muted-foreground"
          message={t('projects.detail.archivedBanner')}
          actionLabel={t('projects.list.actions.restore')}
          onAction={() => onAction('restore')}
        />
      )}

      {isProjectCompleted(project) && (
        <ProjectStatusBanner
          icon={Trophy}
          colorClass="bg-violet-500/10 [&>svg]:text-violet-600 dark:[&>svg]:text-violet-400"
          message={t('projects.detail.completedBanner')}
          actionLabel={t('projects.list.actions.reopen')}
          onAction={() => onAction('reopen')}
        />
      )}

      {isProjectTrashed(project) && (
        <ProjectStatusBanner
          icon={Trash2}
          colorClass="bg-red-500/10 [&>svg]:text-red-600 dark:[&>svg]:text-red-400"
          message={
            project.deleted_at
              ? t('projects.detail.trashedBanner', {
                  date: new Date(project.deleted_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  }),
                })
              : t('projects.detail.trashedBanner', { date: '' })
          }
          actionLabel={t('projects.list.actions.restoreTrash')}
          onAction={() => onAction('restoreTrash')}
        />
      )}

      <div className="min-w-0">
        <div className="flex items-start gap-3">
          <div className="shrink-0 pt-0.5">
            <ProjectAvatar imageUrl={project.image_url} name={project.name} size={48} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1.5">
                <StatusBadge
                  labelKey="projects.detail.contextBadge"
                  descriptionKey="projects.detail.contextBadgeDescription"
                  ariaLabelKey="projects.detail.contextBadgeAriaLabel"
                  variant="secondary"
                />
                <ProjectStatusBadge status={project.status as ProjectStatus} />
              </div>

              <div className="flex shrink-0 items-center gap-1">
                {hasActiveSurveys && onRefresh && (
                  <RefreshRealtimeButton
                    isRefreshing={isRefreshing ?? false}
                    isRealtimeConnected={isRealtimeConnected ?? false}
                    lastSyncedAt={lastSyncedAt}
                    onRefresh={onRefresh}
                    ariaLabel={t('surveys.dashboard.refresh')}
                  />
                )}

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      className="text-muted-foreground"
                      aria-label={t('projects.list.actions.moreActions')}
                    >
                      <EllipsisVertical className="size-4" aria-hidden />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {actions.map((action) => {
                      const ui = PROJECT_ACTION_UI[action];
                      const Icon = ui.icon;

                      return (
                        <DropdownMenuItem
                          key={action}
                          {...(ui.menuItemVariant && { variant: ui.menuItemVariant })}
                          onClick={() => onAction(action)}
                        >
                          <Icon className="size-4" aria-hidden />
                          {t(`projects.list.actions.${action}` as MessageKey)}
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div className="text-foreground mt-1 min-w-0">
              <h1 className="text-foreground min-w-0 text-2xl leading-tight font-bold wrap-break-word sm:text-3xl">
                {project.name}
              </h1>
            </div>
          </div>
        </div>

        {project.summary && (
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{project.summary}</p>
        )}

        <ProjectMetadata
          updatedAt={project.updated_at}
          createdAt={project.created_at}
          lastResponseAt={lastResponseAt}
          owner={owner}
        />
      </div>
    </div>
  );
}
