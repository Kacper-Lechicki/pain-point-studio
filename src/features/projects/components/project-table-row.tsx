'use client';

import type React from 'react';

import { MoreHorizontal, Trash2 } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { TableCell, TableRow } from '@/components/ui/table';
import type { ProjectWithMetrics } from '@/features/projects/actions/get-projects';
import { ProjectStatusBadge } from '@/features/projects/components/project-status-badge';
import type { ProjectStatus } from '@/features/projects/types';

interface ProjectTableRowProps {
  project: ProjectWithMetrics;
  now: Date;
  onSelect: (projectId: string) => void;
  onDelete: (project: ProjectWithMetrics) => void;
}

export function ProjectTableRow({ project, now, onSelect, onDelete }: ProjectTableRowProps) {
  const t = useTranslations();
  const format = useFormatter();
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
    'aria-label': project.name,
  };

  return (
    <TableRow
      className="even:bg-muted/80 h-14 cursor-pointer transition-all"
      {...tableRowInteraction}
    >
      <TableCell className="max-w-0 min-w-0 overflow-hidden px-4 py-3 align-top">
        <div className="min-w-0 overflow-hidden">
          <span className="text-foreground block truncate text-sm font-semibold">
            {project.name}
          </span>
          {project.description && (
            <p className="text-muted-foreground mt-0.5 truncate text-[11px]">
              {project.description}
            </p>
          )}
        </div>
      </TableCell>

      <TableCell className="border-border/30 min-w-0 border-l px-4 py-3 text-center">
        <ProjectStatusBadge status={project.status as ProjectStatus} />
      </TableCell>

      <TableCell className="text-muted-foreground border-border/30 min-w-0 border-l px-5 py-3 text-xs tabular-nums">
        {project.surveyCount}
      </TableCell>

      <TableCell className="text-muted-foreground border-border/30 min-w-0 border-l px-5 py-3 text-xs tabular-nums">
        {project.activeSurveyCount}
      </TableCell>

      <TableCell className="text-muted-foreground border-border/30 min-w-0 border-l px-5 py-3 text-xs tabular-nums">
        {project.responseCount}
      </TableCell>

      <TableCell className="text-muted-foreground border-border/30 hidden min-w-0 truncate border-l px-4 py-3 text-xs xl:table-cell">
        {updatedAtLabel}
      </TableCell>

      <TableCell className="w-12 shrink-0 px-2 py-3" onClick={(e) => e.stopPropagation()}>
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
