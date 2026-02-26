'use client';

import { useEffect, useState } from 'react';

import { Archive, ArrowLeft, EllipsisVertical, Pencil, RotateCcw, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ROUTES } from '@/config/routes';
import { ProjectPhaseBadge } from '@/features/projects/components/project-phase-badge';
import { ProjectStatusBadge } from '@/features/projects/components/project-status-badge';
import { isProjectArchived } from '@/features/projects/lib/project-helpers';
import type { Project, ProjectStatus, ResearchPhase } from '@/features/projects/types';
import { useRouter } from '@/i18n/routing';

const NAV_DEPTH_KEY = '__nav_depth';

function canGoBack(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  if ('navigation' in window) {
    return Boolean((window.navigation as { canGoBack?: boolean }).canGoBack);
  }

  try {
    return (Number(sessionStorage.getItem(NAV_DEPTH_KEY)) || 0) > 0;
  } catch {
    return false;
  }
}

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
  onEdit,
  onArchive,
  onDelete,
}: ProjectDetailHeaderProps) {
  const t = useTranslations();
  const router = useRouter();
  const isArchived = isProjectArchived(project);
  const [goBack, setGoBack] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setGoBack(canGoBack()));

    return () => cancelAnimationFrame(raf);
  }, []);

  const handleBack = () => {
    if (goBack) {
      router.back();
    } else {
      router.push(ROUTES.dashboard.projects);
    }
  };

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

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleBack}
          className="text-muted-foreground md:hover:text-foreground -ml-1 inline-flex size-9 shrink-0 touch-manipulation items-center justify-center rounded-md transition-colors"
          aria-label={t('common.goBack')}
        >
          <ArrowLeft className="size-5 md:size-4" aria-hidden />
        </button>

        <h1 className="text-foreground min-w-0 truncate text-xl leading-tight font-bold md:text-2xl">
          {project.name}
        </h1>

        <div className="flex shrink-0 items-center gap-1.5">
          <ProjectStatusBadge status={project.status as ProjectStatus} />
          {phase && <ProjectPhaseBadge phase={phase} />}
        </div>

        <div className="ml-auto flex shrink-0 items-center">
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

      {project.description && (
        <p className="text-muted-foreground line-clamp-2 pl-9 text-sm leading-relaxed md:pl-8">
          {project.description}
        </p>
      )}
    </div>
  );
}
