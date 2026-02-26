'use client';

import { Archive, EllipsisVertical, RotateCcw, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ProjectPhaseBadge } from '@/features/projects/components/project-phase-badge';
import { ProjectStatusBadge } from '@/features/projects/components/project-status-badge';
import { isProjectArchived } from '@/features/projects/lib/project-helpers';
import type { Project, ProjectStatus, ResearchPhase } from '@/features/projects/types';

interface ProjectDetailHeaderProps {
  project: Project;
  phase: ResearchPhase | null;
  onEdit: () => void;
  onArchive: () => void;
  onDelete: () => void;
}

export function ProjectDetailHeader({
  project,
  phase,
  onArchive,
  onDelete,
}: ProjectDetailHeaderProps) {
  const t = useTranslations();
  const isArchived = isProjectArchived(project);

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
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant="secondary" className="text-[11px]">
              {t('projects.detail.contextBadge')}
            </Badge>
            <ProjectStatusBadge status={project.status as ProjectStatus} />
            {phase && <ProjectPhaseBadge phase={phase} />}
          </div>

          <h1 className="text-foreground mt-1 min-w-0 truncate text-3xl leading-tight font-bold">
            {project.name}
          </h1>

          {project.description && (
            <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
              {project.description}
            </p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1">
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
