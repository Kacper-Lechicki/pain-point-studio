import { getTranslations } from 'next-intl/server';

import { PageTransition } from '@/components/ui/page-transition';
import { DASHBOARD_PAGE_BODY_GAP } from '@/features/dashboard/config/layout';
import { CreateProjectForm } from '@/features/projects/components/create-project-form';

export default async function NewProjectPage() {
  const t = await getTranslations();

  return (
    <PageTransition>
      <div className={DASHBOARD_PAGE_BODY_GAP}>
        <h1 className="text-3xl font-bold">{t('projects.create.title')}</h1>
        <p className="text-muted-foreground mt-1 text-sm">{t('projects.create.pageDescription')}</p>
      </div>

      <CreateProjectForm />
    </PageTransition>
  );
}
