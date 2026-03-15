'use client';

import { useCallback } from 'react';

import { Archive, EllipsisVertical, Trash2, Trophy } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { RefreshRealtimeButton } from '@/components/ui/refresh-realtime-button';
import { StatusBadge } from '@/components/ui/status-badge';
import { Textarea } from '@/components/ui/textarea';
import type { ProjectOwner } from '@/features/projects/actions/get-project';
import { updateProject } from '@/features/projects/actions/update-project';
import { InlineEditActions } from '@/features/projects/components/inline-edit-actions';
import { ProjectAvatar } from '@/features/projects/components/project-avatar';
import { ProjectImageUpload } from '@/features/projects/components/project-image-upload';
import { ProjectMetadata } from '@/features/projects/components/project-metadata';
import { ProjectStatusBadge } from '@/features/projects/components/project-status-badge';
import { ProjectStatusBanner } from '@/features/projects/components/project-status-banner';
import { PROJECT_NAME_MAX_LENGTH, PROJECT_SUMMARY_MAX_LENGTH } from '@/features/projects/config';
import type { ProjectAction } from '@/features/projects/config/status';
import { PROJECT_ACTION_UI, getAvailableActions } from '@/features/projects/config/status';
import { useInlineEdit } from '@/features/projects/hooks/use-inline-edit';
import {
  isProjectArchived,
  isProjectCompleted,
  isProjectReadOnly,
  isProjectTrashed,
} from '@/features/projects/lib/project-helpers';
import type { Project, ProjectStatus } from '@/features/projects/types';
import type { MessageKey } from '@/i18n/types';
import { cn } from '@/lib/common/utils';

type ProjectDetailHeaderEditSuccess = {
  name: string;
  summary: string | undefined;
  targetResponses?: number;
};

interface ProjectDetailHeaderProps {
  project: Project;
  userId: string;
  owner?: ProjectOwner | null;
  lastResponseAt?: string | null;
  onEdit: () => void;
  onAction: (action: ProjectAction) => void;
  onImageChange: (url: string | null) => void;
  onEditSuccess?: (data: ProjectDetailHeaderEditSuccess) => void;
  isRefreshing?: boolean | undefined;
  isRealtimeConnected?: boolean | undefined;
  lastSyncedAt?: number | undefined;
  onRefresh?: (() => void) | undefined;
  hasActiveSurveys?: boolean | undefined;
}

export function ProjectDetailHeader({
  project,
  userId,
  owner,
  onAction,
  onImageChange,
  lastResponseAt,
  onEditSuccess,
  isRefreshing,
  isRealtimeConnected,
  lastSyncedAt,
  onRefresh,
  hasActiveSurveys,
}: ProjectDetailHeaderProps) {
  const t = useTranslations();
  const readOnly = isProjectReadOnly(project);
  const canEditInline = !readOnly && !!onEditSuccess;
  const actions = getAvailableActions(project.status as ProjectStatus);

  const emitEditSuccess = useCallback(
    (updatedName: string, updatedSummary: string | undefined) => {
      onEditSuccess?.({
        name: updatedName,
        summary: updatedSummary,
        targetResponses: project.target_responses,
      });
    },
    [onEditSuccess, project.target_responses]
  );

  const { inputRef: nameInputRef, ...nameEdit } = useInlineEdit<HTMLInputElement>({
    currentValue: project.name,
    persist: async (trimmed) => {
      if (!trimmed) {
        return true;
      }

      const result = await updateProject({
        projectId: project.id,
        name: trimmed,
        summary: project.summary ?? '',
      });

      return !!result?.error;
    },
    onSaved: (trimmed) => emitEditSuccess(trimmed, project.summary ?? undefined),
  });

  const { inputRef: summaryInputRef, ...summaryEdit } = useInlineEdit<HTMLTextAreaElement>({
    currentValue: project.summary ?? '',
    persist: async (trimmed) => {
      const result = await updateProject({
        projectId: project.id,
        name: project.name,
        ...(trimmed ? { summary: trimmed } : {}),
      });

      return !!result?.error;
    },
    onSaved: (trimmed) => emitEditSuccess(project.name, trimmed || undefined),
  });

  return (
    <div className="flex flex-col gap-2">
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
            {!readOnly ? (
              <ProjectImageUpload
                projectId={project.id}
                userId={userId}
                imageUrl={project.image_url}
                projectName={project.name}
                onImageChange={onImageChange}
              />
            ) : (
              <ProjectAvatar imageUrl={project.image_url} name={project.name} size={48} />
            )}
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
              {nameEdit.isEditing ? (
                <div className="flex min-w-0 flex-col gap-2">
                  <Input
                    ref={nameInputRef}
                    value={nameEdit.draft}
                    onChange={(e) => nameEdit.setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        void nameEdit.save();
                      }

                      if (e.key === 'Escape') {
                        nameEdit.cancel();
                      }
                    }}
                    maxLength={PROJECT_NAME_MAX_LENGTH}
                    className="text-foreground h-auto min-w-0 py-1.5 text-base"
                  />
                  <InlineEditActions
                    charCount={nameEdit.draft.length}
                    maxLength={PROJECT_NAME_MAX_LENGTH}
                    saveStatus={nameEdit.saveStatus}
                    onCancel={nameEdit.cancel}
                    onSave={() => void nameEdit.save()}
                  />
                </div>
              ) : (
                <h1
                  className={cn(
                    'text-foreground min-w-0 text-2xl leading-tight font-bold wrap-break-word sm:text-3xl',
                    canEditInline &&
                      'decoration-muted-foreground/40 w-fit cursor-pointer rounded-md underline-offset-4 md:hover:underline'
                  )}
                  onClick={canEditInline ? nameEdit.startEditing : undefined}
                  tabIndex={canEditInline ? 0 : undefined}
                  onKeyDown={
                    canEditInline
                      ? (e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            nameEdit.startEditing();
                          }
                        }
                      : undefined
                  }
                >
                  {project.name}
                </h1>
              )}
            </div>
          </div>
        </div>

        {summaryEdit.isEditing ? (
          <div className="mt-2 flex flex-col gap-2">
            <Textarea
              ref={summaryInputRef}
              value={summaryEdit.draft}
              onChange={(e) => summaryEdit.setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  summaryEdit.cancel();
                }
              }}
              maxLength={PROJECT_SUMMARY_MAX_LENGTH}
              placeholder={t('projects.create.summaryPlaceholder')}
              className="text-muted-foreground min-h-[60px] min-w-0 resize-none text-sm leading-relaxed"
              rows={2}
            />
            <InlineEditActions
              charCount={summaryEdit.draft.length}
              maxLength={PROJECT_SUMMARY_MAX_LENGTH}
              saveStatus={summaryEdit.saveStatus}
              onCancel={summaryEdit.cancel}
              onSave={() => void summaryEdit.save()}
            />
          </div>
        ) : (
          (project.summary || canEditInline) && (
            <p
              className={cn(
                'text-muted-foreground mt-2 text-sm leading-relaxed',
                !project.summary && 'italic',
                canEditInline &&
                  'decoration-muted-foreground/40 w-fit cursor-pointer rounded-md underline-offset-4 md:hover:underline'
              )}
              onClick={canEditInline ? summaryEdit.startEditing : undefined}
              role={canEditInline ? 'button' : undefined}
              tabIndex={canEditInline ? 0 : undefined}
              onKeyDown={
                canEditInline
                  ? (e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        summaryEdit.startEditing();
                      }
                    }
                  : undefined
              }
            >
              {project.summary || t('projects.create.summaryPlaceholder')}
            </p>
          )
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
