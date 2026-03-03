'use client';

import { useTransition } from 'react';

import { ArrowRight, FolderKanban, Pin, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { ROUTES } from '@/config';
import type { OverviewProject } from '@/features/dashboard/actions/get-dashboard-overview';
import { setPinnedProject } from '@/features/dashboard/actions/set-pinned-project';
import {
  BENTO_CARD_CLASS,
  BENTO_ROW4_CARD_MIN_H,
} from '@/features/dashboard/components/bento/bento-styles';
import { BENTO_VISIBLE_ITEMS } from '@/features/dashboard/config/layout';
import { getProjectDetailUrl } from '@/features/projects/lib/project-urls';
import Link from '@/i18n/link';
import { cn } from '@/lib/common/utils';

interface DashboardProjectsListProps {
  projects: OverviewProject[];
  pinnedProjectId: string | null;
}

export function DashboardProjectsList({ projects, pinnedProjectId }: DashboardProjectsListProps) {
  const t = useTranslations('dashboard.bento');
  const [isPending, startTransition] = useTransition();

  const visibleProjects = projects.slice(0, BENTO_VISIBLE_ITEMS);

  function handleTogglePin(projectId: string) {
    startTransition(async () => {
      const nextValue = pinnedProjectId === projectId ? null : projectId;
      await setPinnedProject({ projectId: nextValue });
    });
  }

  return (
    <Card className={cn(BENTO_CARD_CLASS, BENTO_ROW4_CARD_MIN_H, 'flex h-full flex-col')}>
      <div className="flex min-h-0 flex-1 flex-col p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
              {t('projects.title')}
            </p>
            {visibleProjects.length > 0 && (
              <Link
                href={ROUTES.dashboard.projects}
                className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs transition-colors"
              >
                {t('projects.viewAll')}
                <ArrowRight className="size-3" />
              </Link>
            )}
          </div>
          <FolderKanban className="text-chart-pink size-4 shrink-0" />
        </div>

        {visibleProjects.length === 0 ? (
          <EmptyState
            variant="compact"
            icon={FolderKanban}
            title={t('projects.noProjectsToPin')}
            description={t('projects.noProjectsDescription')}
            action={
              <Button variant="outline" size="sm" asChild>
                <Link href={ROUTES.dashboard.projectNew}>
                  <Plus className="size-3.5" />
                  {t('projects.emptyCta')}
                </Link>
              </Button>
            }
          />
        ) : (
          <div className="mt-2">
            {visibleProjects.map((project) => {
              const isPinned = pinnedProjectId === project.id;

              return (
                <div
                  key={project.id}
                  className="-mx-1 flex items-start gap-2 rounded-md px-1 py-1.5"
                >
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    disabled={isPending}
                    onClick={() => handleTogglePin(project.id)}
                    className={cn(
                      'shrink-0 disabled:opacity-50',
                      isPinned
                        ? 'text-chart-pink md:hover:text-chart-pink'
                        : 'text-muted-foreground/40 md:hover:text-muted-foreground/40'
                    )}
                    aria-label={isPinned ? t('pinned.unpin') : t('pinned.pin')}
                  >
                    <Pin className={cn('size-3.5', isPinned && 'fill-current')} />
                  </Button>

                  <div className="flex min-w-0 flex-1 flex-col gap-0">
                    <div className="flex min-w-0 flex-1 items-center gap-2">
                      <div className="min-w-0 flex-1 overflow-hidden">
                        <Link
                          href={getProjectDetailUrl(project.id)}
                          className="hover:text-foreground inline-block max-w-full truncate text-sm font-medium transition-colors hover:underline"
                        >
                          {project.name}
                        </Link>
                      </div>
                      {/* Inline metrics — aligned right */}
                      <span className="text-muted-foreground/60 hidden shrink-0 items-center gap-1.5 text-xs tabular-nums sm:flex">
                        <span>{t('projects.surveys', { count: project.surveyCount })}</span>
                        <span className="text-muted-foreground/30">&middot;</span>
                        <span>{t('projects.responses', { count: project.responseCount })}</span>
                      </span>
                      <span className="text-muted-foreground/60 shrink-0 text-xs tabular-nums sm:hidden">
                        {t('projects.responses', { count: project.responseCount })}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Card>
  );
}
