import { FolderKanban, Plus } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { PageTransition } from '@/components/ui/page-transition';
import { ROUTES } from '@/config';
import { DASHBOARD_PAGE_BODY_GAP_TOP } from '@/features/dashboard/config/layout';
import { getProjects } from '@/features/projects/actions/get-projects';
import { getProjectsListExtras } from '@/features/projects/actions/get-projects-list-extras';
import { ProjectsListPage } from '@/features/projects/components/projects-list-page';
import Link from '@/i18n/link';

export const dynamic = 'force-dynamic';

export default async function ProjectsPage() {
  const [projects, extras, t] = await Promise.all([
    getProjects(),
    getProjectsListExtras(),
    getTranslations(),
  ]);
  const hasProjects = (projects ?? []).length > 0;

  return (
    <PageTransition>
      <div className="flex flex-row flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="flex items-center gap-2 text-3xl font-bold">
            <FolderKanban className="size-7 shrink-0" aria-hidden />
            {t('projects.title')}
          </h1>

          <p className="text-muted-foreground mt-1 text-sm">{t('projects.description')}</p>
        </div>

        {hasProjects && (
          <Button asChild className="shrink-0">
            <Link href={ROUTES.dashboard.projectNew}>
              <Plus className="size-4" aria-hidden />
              {t('projects.createProject')}
            </Link>
          </Button>
        )}
      </div>

      <div className={DASHBOARD_PAGE_BODY_GAP_TOP}>
        {hasProjects ? (
          <ProjectsListPage projects={projects!} extras={extras} />
        ) : (
          <EmptyState
            icon={FolderKanban}
            title={t('projects.empty.title')}
            description={t('projects.empty.description')}
            action={
              <Button asChild>
                <Link href={ROUTES.dashboard.projectNew}>
                  <Plus className="size-4" aria-hidden />
                  {t('projects.empty.cta')}
                </Link>
              </Button>
            }
          />
        )}
      </div>
    </PageTransition>
  );
}
