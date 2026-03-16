import { notFound } from 'next/navigation';

import { getTranslations } from 'next-intl/server';

import { PageTransition } from '@/components/ui/page-transition';
import { ROUTES } from '@/config';
import { DashboardPageBack } from '@/features/dashboard/components/layout/dashboard-page-back';
import { getProject } from '@/features/projects/actions/get-project';
import { ProjectSettingsPage } from '@/features/projects/components/project-settings-page';

interface ProjectSettingsRouteProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ProjectSettingsRouteProps) {
  const { id } = await params;
  const [data, t] = await Promise.all([getProject(id), getTranslations()]);

  if (!data) {
    return { title: t('metadata.title') };
  }

  return {
    title: `${t('projects.settings.title')} — ${data.project.name} | ${t('metadata.title')}`,
  };
}

export default async function ProjectSettingsRoute({ params }: ProjectSettingsRouteProps) {
  const { id } = await params;

  const [data, t] = await Promise.all([getProject(id), getTranslations()]);

  if (!data) {
    notFound();
  }

  return (
    <>
      <DashboardPageBack
        href={`${ROUTES.dashboard.projects}/${id}`}
        label={t('common.backToProject')}
      />

      <PageTransition>
        <ProjectSettingsPage project={data.project} owner={data.owner} />
      </PageTransition>
    </>
  );
}
