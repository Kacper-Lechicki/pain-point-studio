import { notFound } from 'next/navigation';

import { PageTransition } from '@/components/ui/page-transition';
import { DashboardPageBack } from '@/features/dashboard/components/layout/dashboard-page-back';
import { getProject } from '@/features/projects/actions/get-project';
import { ProjectDashboardPage } from '@/features/projects/components/project-dashboard-page';

interface ProjectDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const { id } = await params;
  const data = await getProject(id);

  if (!data) {
    notFound();
  }

  return (
    <>
      <DashboardPageBack />

      <PageTransition>
        <ProjectDashboardPage
          project={data.project}
          surveys={data.surveys}
          surveysByPhase={data.surveysByPhase}
        />
      </PageTransition>
    </>
  );
}
