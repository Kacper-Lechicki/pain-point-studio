'use client';

import type React from 'react';

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
import { TableCell, TableRow } from '@/components/ui/table';
import type { ProjectWithMetrics } from '@/features/projects/actions/get-projects';
import { ProjectStatusBadge } from '@/features/projects/components/project-status-badge';
import { ValidationProgressDots } from '@/features/projects/components/validation-progress-dots';
import { PROJECT_CONTEXTS_CONFIG } from '@/features/projects/config/contexts';
import type { ProjectContext, ProjectStatus } from '@/features/projects/types';
import type { MessageKey } from '@/i18n/types';
import { cn } from '@/lib/common/utils';

interface ProjectTableRowProps {
  project: ProjectWithMetrics;
  isSelected: boolean;
  now: Date;
  onSelect: (projectId: string) => void;
  onEdit: (project: ProjectWithMetrics) => void;
  onArchive: (project: ProjectWithMetrics) => void;
  onDelete: (project: ProjectWithMetrics) => void;
}

export function ProjectTableRow({
  project,
  isSelected,
  now,
  onSelect,
  onEdit,
  onArchive,
  onDelete,
}: ProjectTableRowProps) {
  const t = useTranslations();
  const format = useFormatter();
  const isArchived = project.status === 'archived';
  const contextConfig = PROJECT_CONTEXTS_CONFIG[project.context as ProjectContext];
  const updatedAtLabel = format.relativeTime(new Date(project.updated_at), now);

  const tableRowInteraction = {
    onClick: () => {
      if (document.querySelector('[data-slot="dialog-overlay"]')) {
        return;
      }

      onSelect(project.id);
    },
    role: 'button' as const,
    tabIndex: 0,
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onSelect(project.id);
      }
    },
    'aria-pressed': isSelected,
    'aria-label': project.name,
  };

  return (
    <TableRow
      className={cn(
        'even:bg-muted/80 h-14 cursor-pointer transition-all',
        isSelected && 'bg-muted/60 even:bg-muted/60'
      )}
      {...tableRowInteraction}
    >
      <TableCell className="min-w-0 overflow-hidden py-2.5">
        <span className="text-foreground block truncate text-sm font-semibold">{project.name}</span>

        {project.description && (
          <p className="text-muted-foreground mt-0.5 truncate text-[11px]">{project.description}</p>
        )}
      </TableCell>

      <TableCell className="border-border/30 min-w-0 border-l text-center">
        <ProjectStatusBadge status={project.status as ProjectStatus} />
      </TableCell>

      <TableCell className="text-muted-foreground border-border/30 min-w-0 truncate border-l text-xs">
        {t(contextConfig.labelKey as MessageKey)}
      </TableCell>

      <TableCell className="text-muted-foreground border-border/30 min-w-0 truncate border-l text-xs tabular-nums">
        {project.surveyCount}
      </TableCell>

      <TableCell className="text-muted-foreground border-border/30 min-w-0 truncate border-l text-xs tabular-nums">
        {project.responseCount}
      </TableCell>

      <TableCell className="border-border/30 hidden min-w-0 border-l lg:table-cell">
        {project.phaseStatuses ? (
          <ValidationProgressDots phaseStatuses={project.phaseStatuses} />
        ) : (
          <span className="text-muted-foreground text-xs">—</span>
        )}
      </TableCell>

      <TableCell className="text-muted-foreground border-border/30 hidden min-w-0 truncate border-l pr-4 pl-3 text-xs xl:table-cell">
        {updatedAtLabel}
      </TableCell>

      <TableCell className="w-10 p-0" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-xs"
                className="text-muted-foreground"
                aria-label={t('projects.list.actions.moreActions')}
                onClick={(e) => e.preventDefault()}
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
      </TableCell>
    </TableRow>
  );
}
