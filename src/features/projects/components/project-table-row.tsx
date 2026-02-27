'use client';

import type React from 'react';

import { MoreHorizontal, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { TableCell, TableRow } from '@/components/ui/table';
import type { ProjectWithMetrics } from '@/features/projects/actions/get-projects';
import type { ProjectListExtras } from '@/features/projects/actions/get-projects-list-extras';
import { ActivitySparkline } from '@/features/projects/components/activity-sparkline';
import { ProjectAvatar } from '@/features/projects/components/project-avatar';
import { ProjectStatusBadge } from '@/features/projects/components/project-status-badge';
import type { ProjectStatus } from '@/features/projects/types';

interface ProjectTableRowProps {
  project: ProjectWithMetrics;
  extras?: ProjectListExtras | undefined;
  onSelect: (projectId: string) => void;
  onDelete: (project: ProjectWithMetrics) => void;
}

export function ProjectTableRow({ project, extras, onSelect, onDelete }: ProjectTableRowProps) {
  const t = useTranslations();

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
      className="even:bg-muted/30 h-14 cursor-pointer transition-all"
      {...tableRowInteraction}
    >
      <TableCell className="max-w-0 min-w-0 overflow-hidden px-4 py-3 align-top">
        <div className="flex min-w-0 items-center gap-2.5 overflow-hidden">
          <ProjectAvatar imageUrl={project.image_url} name={project.name} size={32} />
          <div className="min-w-0 overflow-hidden">
            <span className="text-foreground block truncate text-sm font-semibold">
              {project.name}
            </span>
            {project.summary && (
              <p className="text-muted-foreground mt-0.5 truncate text-[11px]">{project.summary}</p>
            )}
          </div>
        </div>
      </TableCell>

      <TableCell className="border-border/30 min-w-0 border-l px-4 py-3 text-center">
        <ProjectStatusBadge status={project.status as ProjectStatus} />
      </TableCell>

      <TableCell className="text-muted-foreground border-border/30 min-w-0 border-l px-5 py-3 text-xs tabular-nums">
        {project.surveyCount}
      </TableCell>

      <TableCell className="text-muted-foreground border-border/30 min-w-0 border-l px-5 py-3 text-xs tabular-nums">
        {project.responseCount}
      </TableCell>

      <TableCell className="text-muted-foreground border-border/30 hidden min-w-0 border-l px-3 py-3 md:table-cell">
        <div className="w-full">
          <ActivitySparkline data={extras?.sparkline ?? []} fillWidth className="h-7 w-full" />
        </div>
      </TableCell>

      <TableCell className="w-12 shrink-0 py-3" onClick={(e) => e.stopPropagation()}>
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
