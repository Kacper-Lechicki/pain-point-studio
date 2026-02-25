'use client';

import { Archive, EllipsisVertical, Pencil, RotateCcw, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ProjectStatusBadge } from '@/features/projects/components/project-status-badge';
import { isProjectArchived } from '@/features/projects/lib/project-helpers';
import type { Project, ProjectStatus } from '@/features/projects/types';

interface ProjectDetailHeaderProps {
  project: Project;
  onEdit: () => void;
  onArchive: () => void;
  onDelete: () => void;
}

export function ProjectDetailHeader({
  project,
  onEdit,
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

      <div className="flex items-start justify-between gap-3">
        <h1 className="text-foreground min-w-0 text-xl leading-tight font-bold md:text-2xl">
          {project.name}
        </h1>

        <div className="flex shrink-0 items-center gap-1">
          {!isArchived && (
            <Button
              variant="ghost"
              size="icon-md"
              onClick={onEdit}
              aria-label={t('projects.list.actions.edit')}
            >
              <Pencil className="size-4" />
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-md"
                aria-label={t('projects.list.actions.moreActions')}
              >
                <EllipsisVertical className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {!isArchived && (
                <DropdownMenuItem onClick={onEdit}>
                  <Pencil />
                  {t('projects.list.actions.edit')}
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                {...(!isArchived && { variant: 'warning' as const })}
                onClick={onArchive}
              >
                {isArchived ? <RotateCcw /> : <Archive />}
                {t(`projects.list.actions.${isArchived ? 'restore' : 'archive'}`)}
              </DropdownMenuItem>
              {isArchived && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive" onClick={onDelete}>
                    <Trash2 />
                    {t('projects.list.actions.delete')}
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {project.description && (
          <p className="text-muted-foreground line-clamp-2 text-sm leading-relaxed">
            {project.description}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <ProjectStatusBadge status={project.status as ProjectStatus} />
        </div>
      </div>
    </div>
  );
}
