import { ClipboardList } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { PageTransition } from '@/components/ui/page-transition';
import { ROUTES } from '@/config/routes';
import { getDashboardOverview } from '@/features/dashboard/actions/get-dashboard-overview';
import { DashboardOverviewPanel } from '@/features/dashboard/components/dashboard-overview-panel';
import Link from '@/i18n/link';

export default async function DashboardPage() {
  const [t, overview] = await Promise.all([getTranslations('dashboard'), getDashboardOverview()]);

  if (!overview || overview.totalSurveys === 0) {
    return (
      <PageTransition>
        <EmptyState
          icon={ClipboardList}
          title={t('surveysEmpty.title')}
          description={t('surveysEmpty.description')}
          action={
            <Button asChild>
              <Link href={ROUTES.dashboard.surveysNew}>{t('surveysEmpty.cta')}</Link>
            </Button>
          }
        />
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <DashboardOverviewPanel overview={overview} />
    </PageTransition>
  );
}
