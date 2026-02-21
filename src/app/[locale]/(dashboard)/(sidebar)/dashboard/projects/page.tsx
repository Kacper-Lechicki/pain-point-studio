import { FolderKanban } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

import { EmptyState } from '@/components/ui/empty-state';
import { PageTransition } from '@/components/ui/page-transition';
import { DASHBOARD_PAGE_BODY_GAP_TOP } from '@/features/dashboard/config/layout';

export const dynamic = 'force-dynamic';

export default async function ProjectsPage() {
  const t = await getTranslations();

  return (
    <PageTransition>
      <div>
        <h1 className="flex items-center gap-2 text-3xl font-bold">
          <FolderKanban className="size-7 shrink-0" aria-hidden />
          {t('projects.title')}
        </h1>

        <p className="text-muted-foreground mt-1 text-sm">{t('projects.description')}</p>
      </div>

      <div className={DASHBOARD_PAGE_BODY_GAP_TOP}>
        <EmptyState
          icon={FolderKanban}
          title={t('projects.empty.title')}
          description={t('projects.empty.description')}
        />
      </div>
    </PageTransition>
  );
}
