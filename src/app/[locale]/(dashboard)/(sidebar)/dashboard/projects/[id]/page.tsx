import { notFound } from 'next/navigation';

import { PageTransition } from '@/components/ui/page-transition';
import { DashboardPageBack } from '@/features/dashboard/components/layout/dashboard-page-back';
import { getProject } from '@/features/projects/actions/get-project';
import { getProjectSignalsData } from '@/features/projects/actions/get-project-signals-data';
import { ProjectDashboardPage } from '@/features/projects/components/project-dashboard-page';

interface ProjectDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const { id } = await params;
  const [data, signalsData] = await Promise.all([getProject(id), getProjectSignalsData(id)]);

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
          signalsData={signalsData}
        />
      </PageTransition>
    </>
  );
}
