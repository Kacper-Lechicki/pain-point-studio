'use client';

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
import type { ProjectWithMetrics } from '@/features/projects/actions/get-projects';
import type { ProjectListExtras } from '@/features/projects/actions/get-projects-list-extras';
import { ActivitySparkline } from '@/features/projects/components/activity-sparkline';
import { ProjectAvatar } from '@/features/projects/components/project-avatar';
import { ProjectStatusBadge } from '@/features/projects/components/project-status-badge';
import type { ProjectAction } from '@/features/projects/config/status';
import { PROJECT_ACTION_UI, getAvailableActions } from '@/features/projects/config/status';
import type { ProjectStatus } from '@/features/projects/types';
import type { MessageKey } from '@/i18n/types';

interface ProjectCardRowProps {
  project: ProjectWithMetrics;
  extras?: ProjectListExtras | undefined;
  onSelect: (projectId: string) => void;
  onAction: (project: ProjectWithMetrics, action: ProjectAction) => void;
  isSelected?: boolean | undefined;
  onToggleSelect?: ((id: string) => void) | undefined;
}

export function ProjectCardRow({
  project,
  extras,
  onSelect,
  onAction,
  isSelected,
  onToggleSelect,
}: ProjectCardRowProps) {
  const t = useTranslations();
  const actions = getAvailableActions(project.status as ProjectStatus);

  return (
    <div
      className="border-border/50 bg-card flex min-w-0 cursor-pointer flex-col gap-3 rounded-lg border p-3 transition-all"
      onClick={() => onSelect(project.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(project.id);
        }
      }}
      aria-label={project.name}
    >
      <div className="flex min-w-0 items-start justify-between gap-2">
        <div className="flex min-w-0 flex-1 items-start gap-2">
          {onToggleSelect && (
            <div className="shrink-0 pt-0.5" onClick={(e) => e.stopPropagation()}>
              <Checkbox
                checked={isSelected ?? false}
                onCheckedChange={() => onToggleSelect(project.id)}
                aria-label={t('projects.list.bulk.selectProject', { name: project.name })}
              />
            </div>
          )}
          <ProjectAvatar imageUrl={project.image_url} name={project.name} size={32} />
          <div className="flex min-w-0 flex-col items-start gap-1">
            <ProjectStatusBadge status={project.status as ProjectStatus} />
            <span className="text-foreground truncate text-sm font-semibold">{project.name}</span>
          </div>
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
      </div>

      <div className="min-w-0">
        <p className="text-muted-foreground -mt-1 line-clamp-2 text-xs leading-relaxed wrap-break-word">
          {project.summary || '\u00A0'}
        </p>
      </div>

      <div className="text-muted-foreground mt-auto grid min-w-0 grid-cols-3 gap-x-4 text-xs">
        <div className="flex flex-col gap-0.5">
          <span>{t('projects.list.table.surveys')}</span>
          <span className="text-foreground font-medium tabular-nums">{project.surveyCount}</span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span>{t('projects.list.table.responses')}</span>
          <span className="text-foreground font-medium tabular-nums">
            {project.target_responses
              ? `${project.responseCount}/${project.target_responses}`
              : project.responseCount}
          </span>
        </div>
        <div className="flex min-w-0 flex-col gap-0.5">
          <span>{t('projects.list.card.activity')}</span>
          <ActivitySparkline data={extras?.sparkline ?? []} width={80} height={24} fillWidth />
        </div>
      </div>
    </div>
  );
}
