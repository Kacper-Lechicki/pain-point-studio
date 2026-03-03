'use client';

import type React from 'react';

import { MoreHorizontal } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import type { ProjectAction } from '@/features/projects/config/status';
import { PROJECT_ACTION_UI, getAvailableActions } from '@/features/projects/config/status';
import type { ProjectStatus } from '@/features/projects/types';
import type { MessageKey } from '@/i18n/types';

interface ProjectTableRowProps {
  project: ProjectWithMetrics;
  extras?: ProjectListExtras | undefined;
  onSelect: (projectId: string) => void;
  onAction: (project: ProjectWithMetrics, action: ProjectAction) => void;
  isSelected?: boolean | undefined;
  onToggleSelect?: ((id: string) => void) | undefined;
}

export function ProjectTableRow({
  project,
  extras,
  onSelect,
  onAction,
  isSelected,
  onToggleSelect,
}: ProjectTableRowProps) {
  const t = useTranslations();
  const actions = getAvailableActions(project.status as ProjectStatus);

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
      {onToggleSelect && (
        <TableCell className="w-10 shrink-0 px-3 py-3" onClick={(e) => e.stopPropagation()}>
          <Checkbox
            checked={isSelected ?? false}
            onCheckedChange={() => onToggleSelect(project.id)}
            aria-label={t('projects.list.bulk.selectProject', { name: project.name })}
          />
        </TableCell>
      )}
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
        {project.target_responses
          ? `${project.responseCount}/${project.target_responses}`
          : project.responseCount}
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
              {actions.map((action) => {
                const ui = PROJECT_ACTION_UI[action];
                const Icon = ui.icon;

                return (
                  <DropdownMenuItem
                    key={action}
                    {...(ui.menuItemVariant && { variant: ui.menuItemVariant })}
                    onClick={() => onAction(project, action)}
                  >
                    <Icon className="size-4" aria-hidden />
                    {t(`projects.list.actions.${action}` as MessageKey)}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </TableCell>
    </TableRow>
  );
}
