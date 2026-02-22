'use client';

import { Archive, MoreHorizontal, Pencil, Trash2, Undo2 } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { ProjectWithMetrics } from '@/features/projects/actions/get-projects';
import { PROJECT_CONTEXTS_CONFIG } from '@/features/projects/config/contexts';
import type { ProjectContext } from '@/features/projects/types';
import type { MessageKey } from '@/i18n/types';
import { cn } from '@/lib/common/utils';

interface ProjectCardRowProps {
  project: ProjectWithMetrics;
  isSelected: boolean;
  now: Date;
  onSelect: (projectId: string) => void;
  onEdit: (project: ProjectWithMetrics) => void;
  onArchive: (project: ProjectWithMetrics) => void;
  onDelete: (project: ProjectWithMetrics) => void;
}

export function ProjectCardRow({
  project,
  isSelected,
  now,
  onSelect,
  onEdit,
  onArchive,
  onDelete,
}: ProjectCardRowProps) {
  const t = useTranslations();
  const format = useFormatter();
  const isArchived = project.status === 'archived';
  const contextConfig = PROJECT_CONTEXTS_CONFIG[project.context as ProjectContext];
  const updatedAtLabel = format.relativeTime(new Date(project.updated_at), now);

  return (
    <div
      className={cn(
        'border-border/50 flex min-w-0 cursor-pointer flex-col gap-3 rounded-lg border p-3 transition-all',
        isSelected && 'ring-ring/20 border-ring/40 bg-muted/50 ring-2'
      )}
      onClick={() => onSelect(project.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(project.id);
        }
      }}
      aria-pressed={isSelected}
      aria-label={project.name}
    >
      <div className="flex min-w-0 items-start justify-between gap-2">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-foreground truncate text-sm font-semibold">{project.name}</span>

          <Badge
            variant={isArchived ? 'outline' : 'default'}
            className={cn(
              'shrink-0 text-[11px]',
              isArchived
                ? 'border-amber-500/25 bg-amber-500/15 text-amber-700 dark:text-amber-400'
                : 'border-emerald-500/25 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
            )}
          >
            {t(`projects.list.status.${project.status}` as MessageKey)}
          </Badge>
        </div>

        <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-xs"
                className="text-muted-foreground"
                aria-label={t('projects.list.actions.moreActions')}
              >
                <MoreHorizontal className="size-4" aria-hidden />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(project)}>
                <Pencil className="size-4" aria-hidden />
                {t('projects.list.actions.edit')}
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem onClick={() => onArchive(project)}>
                {isArchived ? (
                  <Undo2 className="size-4" aria-hidden />
                ) : (
                  <Archive className="size-4" aria-hidden />
                )}
                {t(isArchived ? 'projects.list.actions.restore' : 'projects.list.actions.archive')}
              </DropdownMenuItem>

              <DropdownMenuItem variant="destructive" onClick={() => onDelete(project)}>
                <Trash2 className="size-4" aria-hidden />
                {t('projects.list.actions.delete')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <p className="text-muted-foreground -mt-1 line-clamp-1 min-h-4 text-xs">
        {project.description || '\u00A0'}
      </p>

      <div className="text-muted-foreground grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
        <div className="flex flex-col gap-0.5">
          <span>{t(contextConfig.labelKey as MessageKey)}</span>

          <span className="text-foreground font-medium">
            {t('projects.list.card.surveys', { count: project.surveyCount })}
          </span>
        </div>

        <div className="flex flex-col gap-0.5">
          <span>{t('projects.list.card.responses', { count: project.responseCount })}</span>
          <span className="text-foreground font-medium">
            {project.validationProgress !== null
              ? t('projects.list.card.progress', {
                  percent: Math.round(project.validationProgress * 100),
                })
              : '—'}
          </span>
        </div>

        <div className="flex flex-col gap-0.5">
          <span>{t('projects.list.card.updated')}</span>
          <span className="text-foreground font-medium">{updatedAtLabel}</span>
        </div>
      </div>
    </div>
  );
}
