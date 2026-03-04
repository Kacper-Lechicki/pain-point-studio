'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { formatDistanceToNow } from 'date-fns';
import {
  Activity,
  Archive,
  Calendar,
  Check,
  EllipsisVertical,
  Pencil,
  RefreshCw,
  Trash2,
  Trophy,
  X,
} from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import { ProjectImageUpload } from '@/features/projects/components/project-image-upload';
import { ProjectStatusBadge } from '@/features/projects/components/project-status-badge';
import {
  PROJECT_NAME_MAX_LENGTH,
  PROJECT_SUMMARY_MAX_LENGTH,
  SAVE_STATUS_FEEDBACK_MS,
} from '@/features/projects/config';
import type { ProjectAction } from '@/features/projects/config/status';
import { PROJECT_ACTION_UI, getAvailableActions } from '@/features/projects/config/status';
import {
  isProjectArchived,
  isProjectCompleted,
  isProjectReadOnly,
  isProjectTrashed,
} from '@/features/projects/lib/project-helpers';
import type { Project, ProjectStatus } from '@/features/projects/types';
import type { MessageKey } from '@/i18n/types';
import { cn } from '@/lib/common/utils';

type EditingField = 'name' | 'summary' | null;
type SaveStatus = 'idle' | 'saving' | 'saved' | 'failed';

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
  /** When provided, name and summary show edit pens and support inline editing. */
  onEditSuccess?: (data: ProjectDetailHeaderEditSuccess) => void;
  /** Realtime refresh state — shown next to the actions dropdown. */
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

  const [editingField, setEditingField] = useState<EditingField>(null);
  const [nameDraft, setNameDraft] = useState(project.name);
  const [summaryDraft, setSummaryDraft] = useState(project.summary ?? '');
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const nameInputRef = useRef<HTMLInputElement>(null);
  const summaryInputRef = useRef<HTMLTextAreaElement>(null);

  const startEditingName = useCallback(() => {
    setNameDraft(project.name);
    setEditingField('name');
  }, [project.name, setNameDraft, setEditingField]);

  const startEditingSummary = useCallback(() => {
    setSummaryDraft(project.summary ?? '');
    setEditingField('summary');
  }, [project.summary, setSummaryDraft, setEditingField]);

  useEffect(() => {
    if (editingField === 'name') {
      nameInputRef.current?.focus();
      nameInputRef.current?.select();
    } else if (editingField === 'summary') {
      summaryInputRef.current?.focus();
      summaryInputRef.current?.select();
    }
  }, [editingField]);

  const saveName = useCallback(async () => {
    const trimmed = nameDraft.trim();

    if (!trimmed || trimmed === project.name) {
      setEditingField(null);

      return;
    }

    setSaveStatus('saving');
    const result = await updateProject({
      projectId: project.id,
      name: trimmed,
      summary: project.summary ?? '',
    });

    if (result?.error) {
      setSaveStatus('failed');

      return;
    }

    setSaveStatus('saved');
    setEditingField(null);
    onEditSuccess?.({
      name: trimmed,
      summary: project.summary ?? undefined,
      targetResponses: project.target_responses,
    });
    setTimeout(() => setSaveStatus('idle'), SAVE_STATUS_FEEDBACK_MS);
  }, [
    project.id,
    project.name,
    project.summary,
    project.target_responses,
    nameDraft,
    onEditSuccess,
  ]);

  const saveSummary = useCallback(async () => {
    const trimmed = summaryDraft.trim();

    if (trimmed === (project.summary ?? '')) {
      setEditingField(null);

      return;
    }

    setSaveStatus('saving');
    const result = await updateProject({
      projectId: project.id,
      name: project.name,
      ...(trimmed ? { summary: trimmed } : {}),
    });

    if (result?.error) {
      setSaveStatus('failed');

      return;
    }

    setSaveStatus('saved');
    setEditingField(null);
    onEditSuccess?.({
      name: project.name,
      summary: trimmed || undefined,
      targetResponses: project.target_responses,
    });
    setTimeout(() => setSaveStatus('idle'), SAVE_STATUS_FEEDBACK_MS);
  }, [
    project.id,
    project.name,
    project.summary,
    project.target_responses,
    summaryDraft,
    onEditSuccess,
  ]);

  const cancelEdit = useCallback(() => {
    setNameDraft(project.name);
    setSummaryDraft(project.summary ?? '');
    setEditingField(null);
    setSaveStatus('idle');
  }, [
    project.name,
    project.summary,
    setNameDraft,
    setSummaryDraft,
    setEditingField,
    setSaveStatus,
  ]);

  const isEditingName = editingField === 'name';
  const isEditingSummary = editingField === 'summary';

  return (
    <div className="flex flex-col gap-2">
      {/* Status banners */}
      {isProjectArchived(project) && (
        <div className="bg-muted flex items-center gap-2 rounded-lg px-3 py-2">
          <Archive className="text-muted-foreground size-4 shrink-0" aria-hidden />
          <span className="text-muted-foreground flex-1 text-sm">
            {t('projects.detail.archivedBanner')}
          </span>
          <Button variant="outline" size="sm" onClick={() => onAction('restore')}>
            {t('projects.list.actions.restore')}
          </Button>
        </div>
      )}

      {isProjectCompleted(project) && (
        <div className="flex items-center gap-2 rounded-lg bg-violet-500/10 px-3 py-2">
          <Trophy className="size-4 shrink-0 text-violet-600 dark:text-violet-400" aria-hidden />
          <span className="text-muted-foreground flex-1 text-sm">
            {t('projects.detail.completedBanner')}
          </span>
          <Button variant="outline" size="sm" onClick={() => onAction('reopen')}>
            {t('projects.list.actions.reopen')}
          </Button>
        </div>
      )}

      {isProjectTrashed(project) && (
        <div className="flex items-center gap-2 rounded-lg bg-red-500/10 px-3 py-2">
          <Trash2 className="size-4 shrink-0 text-red-600 dark:text-red-400" aria-hidden />
          <span className="text-muted-foreground flex-1 text-sm">
            {project.deleted_at
              ? t('projects.detail.trashedBanner', {
                  date: new Date(project.deleted_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  }),
                })
              : t('projects.detail.trashedBanner', { date: '' })}
          </span>
          <Button variant="outline" size="sm" onClick={() => onAction('restoreTrash')}>
            {t('projects.list.actions.restoreTrash')}
          </Button>
        </div>
      )}

      <div className="min-w-0">
        {/* Image + actions row */}
        <div className="flex items-start justify-between gap-2">
          {!readOnly && (
            <div className="shrink-0">
              <ProjectImageUpload
                projectId={project.id}
                userId={userId}
                imageUrl={project.image_url}
                projectName={project.name}
                onImageChange={onImageChange}
              />
            </div>
          )}

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

        {/* Badges + title + description + meta — full width */}
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <StatusBadge
            labelKey="projects.detail.contextBadge"
            descriptionKey="projects.detail.contextBadgeDescription"
            ariaLabelKey="projects.detail.contextBadgeAriaLabel"
            variant="secondary"
          />
          <ProjectStatusBadge status={project.status as ProjectStatus} />
        </div>

        <div className="min-w-0">
          <div className="text-foreground mt-1 min-w-0">
            {isEditingName ? (
              <div className="flex min-w-0 flex-col gap-2">
                <Input
                  ref={nameInputRef}
                  value={nameDraft}
                  onChange={(e) => setNameDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      void saveName();
                    }

                    if (e.key === 'Escape') {
                      cancelEdit();
                    }
                  }}
                  maxLength={PROJECT_NAME_MAX_LENGTH}
                  className="text-foreground h-auto min-w-0 py-1.5 text-base"
                />
                <div className="flex items-center gap-1.5">
                  <span className="text-muted-foreground text-xs tabular-nums">
                    {nameDraft.length}/{PROJECT_NAME_MAX_LENGTH}
                  </span>
                  {saveStatus === 'saving' && (
                    <span className="text-muted-foreground text-xs">
                      {t('projects.detail.about.saving')}
                    </span>
                  )}
                  {saveStatus === 'failed' && (
                    <span className="text-destructive text-xs">
                      {t('projects.detail.about.failed')}
                    </span>
                  )}
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={cancelEdit}
                    aria-label={t('common.cancel')}
                  >
                    <X className="size-3.5" />
                  </Button>
                  <Button
                    size="icon-xs"
                    onClick={() => void saveName()}
                    disabled={saveStatus === 'saving'}
                  >
                    <Check className="size-3.5" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex max-w-full min-w-0 flex-wrap items-center gap-1.5">
                <h1 className="text-foreground min-w-0 text-2xl leading-tight font-bold wrap-break-word sm:text-3xl">
                  {project.name}
                </h1>
                {canEditInline && (
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    className="text-muted-foreground shrink-0"
                    onClick={startEditingName}
                    aria-label={t('projects.detail.editName')}
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                )}
              </div>
            )}
          </div>

          {isEditingSummary ? (
            <div className="mt-2 flex flex-col gap-2">
              <Textarea
                ref={summaryInputRef}
                value={summaryDraft}
                onChange={(e) => setSummaryDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    cancelEdit();
                  }
                }}
                maxLength={PROJECT_SUMMARY_MAX_LENGTH}
                placeholder={t('projects.create.summaryPlaceholder')}
                className="text-muted-foreground min-h-[60px] min-w-0 resize-none text-sm leading-relaxed"
                rows={2}
              />
              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground text-xs tabular-nums">
                  {summaryDraft.length}/{PROJECT_SUMMARY_MAX_LENGTH}
                </span>
                {saveStatus === 'saving' && (
                  <span className="text-muted-foreground text-xs">
                    {t('projects.detail.about.saving')}
                  </span>
                )}
                {saveStatus === 'failed' && (
                  <span className="text-destructive text-xs">
                    {t('projects.detail.about.failed')}
                  </span>
                )}
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={cancelEdit}
                  aria-label={t('common.cancel')}
                >
                  <X className="size-3.5" />
                </Button>
                <Button
                  size="icon-xs"
                  onClick={() => void saveSummary()}
                  disabled={saveStatus === 'saving'}
                >
                  <Check className="size-3.5" />
                </Button>
              </div>
            </div>
          ) : (
            (project.summary || canEditInline) && (
              <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                <span className={cn(!project.summary && 'italic')}>
                  {project.summary || t('projects.create.summaryPlaceholder')}
                </span>
                {canEditInline && (
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    className="text-muted-foreground ml-1.5 inline-flex shrink-0 align-middle"
                    onClick={startEditingSummary}
                    aria-label={t('projects.detail.editSummary')}
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                )}
              </p>
            )
          )}

          <dl className="text-foreground mt-3 flex flex-col gap-1 text-xs">
            <div className="flex items-center gap-1.5">
              <dt className="flex items-center gap-1.5">
                <RefreshCw className="size-3" aria-hidden />
                {t('projects.detail.meta.updated')}
              </dt>
              <dd className="text-muted-foreground">
                {formatDistanceToNow(new Date(project.updated_at), {
                  addSuffix: true,
                }).replace(/^about /i, '')}
              </dd>
            </div>
            <div className="flex items-center gap-1.5">
              <dt className="flex items-center gap-1.5">
                <Activity className="size-3" aria-hidden />
                {t('projects.detail.meta.lastResponse')}
              </dt>
              <dd className="text-muted-foreground">
                {lastResponseAt
                  ? formatDistanceToNow(new Date(lastResponseAt), {
                      addSuffix: true,
                    }).replace(/^about /i, '')
                  : t('projects.detail.meta.noResponses')}
              </dd>
            </div>
            <div className="flex items-center gap-1.5">
              <dt className="flex items-center gap-1.5">
                <Calendar className="size-3" aria-hidden />
                {t('projects.detail.meta.created')}
              </dt>
              <dd className="text-muted-foreground">
                {new Date(project.created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </dd>
            </div>
            {owner && (
              <div className="mt-2.5 flex items-center gap-1.5">
                <Avatar size="sm">
                  {owner.avatarUrl && <AvatarImage src={owner.avatarUrl} alt={owner.fullName} />}
                  <AvatarFallback>
                    {owner.fullName
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span>{owner.fullName}</span>
              </div>
            )}
          </dl>
        </div>
      </div>
    </div>
  );
}
