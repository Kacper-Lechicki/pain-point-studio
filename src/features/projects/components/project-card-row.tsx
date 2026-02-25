'use client';

import { Archive, MoreHorizontal, Pencil, Trash2, Undo2 } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { ProjectWithMetrics } from '@/features/projects/actions/get-projects';
import { ProjectStatusBadge } from '@/features/projects/components/project-status-badge';
import { isProjectArchived } from '@/features/projects/lib/project-helpers';
import type { ProjectStatus } from '@/features/projects/types';
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
  const isArchived = isProjectArchived(project);
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

          <ProjectStatusBadge status={project.status as ProjectStatus} />
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
          <span className="text-foreground font-medium">
            {t('projects.list.card.surveys', { count: project.surveyCount })}
          </span>
        </div>

        <div className="flex flex-col gap-0.5">
          <span>{t('projects.list.card.responses', { count: project.responseCount })}</span>
        </div>

        <div className="flex flex-col gap-0.5">
          <span>{t('projects.list.card.updated')}</span>
          <span className="text-foreground font-medium">{updatedAtLabel}</span>
        </div>
      </div>
    </div>
  );
}
