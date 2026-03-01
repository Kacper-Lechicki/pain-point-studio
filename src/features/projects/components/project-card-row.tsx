'use client';

import { MoreHorizontal, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
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
import type { ProjectStatus } from '@/features/projects/types';

interface ProjectCardRowProps {
  project: ProjectWithMetrics;
  extras?: ProjectListExtras | undefined;
  onSelect: (projectId: string) => void;
  onDelete: (project: ProjectWithMetrics) => void;
}

export function ProjectCardRow({ project, extras, onSelect, onDelete }: ProjectCardRowProps) {
  const t = useTranslations();

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
              <DropdownMenuItem variant="destructive" onClick={() => onDelete(project)}>
                <Trash2 className="size-4" aria-hidden />
                {t('projects.list.actions.delete')}
              </DropdownMenuItem>
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
