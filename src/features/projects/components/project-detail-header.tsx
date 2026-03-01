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
  RotateCcw,
  Trash2,
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
import { PROJECT_NAME_MAX_LENGTH, PROJECT_SUMMARY_MAX_LENGTH } from '@/features/projects/config';
import { isProjectArchived } from '@/features/projects/lib/project-helpers';
import type { Project, ProjectStatus } from '@/features/projects/types';
import { cn } from '@/lib/common/utils';

type EditingField = 'name' | 'summary' | null;
type SaveStatus = 'idle' | 'saving' | 'saved' | 'failed';

export type ProjectDetailHeaderEditSuccess = {
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
  onArchive: () => void;
  onDelete: () => void;
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
  onArchive,
  onDelete,
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
  const isArchived = isProjectArchived(project);
  const canEditInline = !isArchived && !!onEditSuccess;

  const [editingField, setEditingField] = useState<EditingField>(null);
  const [nameDraft, setNameDraft] = useState(project.name);
  const [summaryDraft, setSummaryDraft] = useState(project.summary ?? '');
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const nameInputRef = useRef<HTMLInputElement>(null);
  const summaryInputRef = useRef<HTMLTextAreaElement>(null);

  const startEditingName = useCallback(() => {
    setNameDraft(project.name);
    setEditingField('name');
  }, [project.name]);

  const startEditingSummary = useCallback(() => {
    setSummaryDraft(project.summary ?? '');
    setEditingField('summary');
  }, [project.summary]);

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
    setTimeout(() => setSaveStatus('idle'), 2000);
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
    setTimeout(() => setSaveStatus('idle'), 2000);
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
  }, [project.name, project.summary]);

  const isEditingName = editingField === 'name';
  const isEditingSummary = editingField === 'summary';

  return (
    <div className="flex flex-col gap-2">
      {isArchived && (
        <div className="bg-muted flex items-center gap-2 rounded-lg px-3 py-2">
          <Archive className="text-muted-foreground size-4 shrink-0" aria-hidden />
          <span className="text-muted-foreground flex-1 text-sm">
            {t('projects.detail.archivedBanner')}
          </span>
          <Button variant="outline" size="sm" onClick={onArchive}>
            <RotateCcw className="size-3.5" aria-hidden />
            {t('projects.list.actions.restore')}
          </Button>
        </div>
      )}

      <div className="flex min-w-0 flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 flex-1 flex-col gap-3 md:flex-row md:items-start">
          {!isArchived && (
            <div className="flex shrink-0 md:mt-1">
              <ProjectImageUpload
                projectId={project.id}
                userId={userId}
                imageUrl={project.image_url}
                projectName={project.name}
                onImageChange={onImageChange}
              />
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <StatusBadge
                labelKey="projects.detail.contextBadge"
                descriptionKey="projects.detail.contextBadgeDescription"
                ariaLabelKey="projects.detail.contextBadgeAriaLabel"
                variant="secondary"
              />
              <ProjectStatusBadge status={project.status as ProjectStatus} />
            </div>

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
                      aria-label={t('projects.detail.about.cancel')}
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
                  <h1 className="text-foreground min-w-0 text-3xl leading-tight font-bold wrap-break-word">
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
                    aria-label={t('projects.detail.about.cancel')}
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

        <div className="flex shrink-0 items-center gap-2">
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
              <DropdownMenuItem variant="destructive" onClick={onDelete}>
                <Trash2 />
                {t('projects.list.actions.delete')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
