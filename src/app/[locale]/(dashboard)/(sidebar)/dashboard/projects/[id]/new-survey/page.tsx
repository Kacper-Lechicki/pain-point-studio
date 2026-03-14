import { redirect } from 'next/navigation';

import { getTranslations } from 'next-intl/server';

import { PageTransition } from '@/components/ui/page-transition';
import { DASHBOARD_PAGE_BODY_GAP } from '@/config/layout';
import { ROUTES } from '@/config/routes';
import { getAuthUser } from '@/features/auth/actions/get-user';
import { getProject } from '@/features/projects/actions/get-project';
import { CreateSurveyWizard } from '@/features/surveys/components/builder/create-survey-wizard';

interface NewSurveyPageProps {
  params: Promise<{ id: string }>;
}

export default async function NewSurveyPage({ params }: NewSurveyPageProps) {
  const [t, user, resolvedParams] = await Promise.all([getTranslations(), getAuthUser(), params]);

  if (!user) {
    redirect(ROUTES.auth.signIn);
  }

  const projectDetail = await getProject(resolvedParams.id);

  if (!projectDetail) {
    redirect(ROUTES.dashboard.projects);
  }

  return (
    <PageTransition>
      <div className={DASHBOARD_PAGE_BODY_GAP}>
        <h1 className="text-3xl font-bold">{t('surveys.create.title')}</h1>
        <p className="text-muted-foreground mt-1 text-sm">{t('surveys.create.description')}</p>
      </div>

      <CreateSurveyWizard
        projectId={resolvedParams.id}
        projectName={projectDetail.project.name}
        projectStatus={projectDetail.project.status}
      />
    </PageTransition>
  );
}
