import { redirect } from 'next/navigation';

import { getTranslations } from 'next-intl/server';

import { PageTransition } from '@/components/ui/page-transition';
import { ROUTES } from '@/config/routes';
import { getAuthUser } from '@/features/auth/actions/get-user';
import { DASHBOARD_PAGE_BODY_GAP } from '@/features/dashboard/config/layout';
import { CreateProjectWizard } from '@/features/projects/components/create-project-wizard';

export default async function NewProjectPage() {
  const [t, user] = await Promise.all([getTranslations(), getAuthUser()]);

  if (!user) {
    redirect(ROUTES.auth.signIn);
  }

  return (
    <PageTransition>
      <div className={DASHBOARD_PAGE_BODY_GAP}>
        <h1 className="text-3xl font-bold">{t('projects.create.title')}</h1>
        <p className="text-muted-foreground mt-1 text-sm">{t('projects.create.pageDescription')}</p>
      </div>

      <CreateProjectWizard userId={user.id} />
    </PageTransition>
  );
}
