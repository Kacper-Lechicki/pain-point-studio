import { notFound } from 'next/navigation';

import { getTranslations } from 'next-intl/server';

import { PageTransition } from '@/components/ui/page-transition';
import { ROUTES } from '@/config';
import { DashboardPageBack } from '@/features/dashboard/components/layout/dashboard-page-back';
import { getProject } from '@/features/projects/actions/get-project';
import { ProjectDangerZonePage } from '@/features/projects/components/project-danger-zone-page';

interface ProjectDangerZoneRouteProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ProjectDangerZoneRouteProps) {
  const { id } = await params;
  const [data, t] = await Promise.all([getProject(id), getTranslations()]);

  if (!data) {
    return { title: t('metadata.title') };
  }

  return {
    title: `${t('projects.settings.dangerZone.title')} — ${data.project.name} | ${t('metadata.title')}`,
  };
}

export default async function ProjectDangerZoneRoute({ params }: ProjectDangerZoneRouteProps) {
  const { id } = await params;

  const data = await getProject(id);

  if (!data) {
    notFound();
  }

  const t = await getTranslations();

  return (
    <>
      <DashboardPageBack
        href={`${ROUTES.dashboard.projects}/${id}`}
        label={t('common.backToProject')}
      />

      <PageTransition>
        <ProjectDangerZonePage project={data.project} />
      </PageTransition>
    </>
  );
}
