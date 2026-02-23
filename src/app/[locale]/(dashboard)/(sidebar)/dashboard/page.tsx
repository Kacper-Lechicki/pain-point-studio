import { FolderKanban, Plus } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { PageTransition } from '@/components/ui/page-transition';
import { ROUTES } from '@/config';
import { getDashboardOverview } from '@/features/dashboard/actions/get-dashboard-overview';
import { DashboardOverview } from '@/features/dashboard/components/dashboard-overview';
import Link from '@/i18n/link';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const [overview, t] = await Promise.all([getDashboardOverview(), getTranslations()]);

  if (!overview) {
    return (
      <PageTransition>
        <EmptyState
          icon={FolderKanban}
          title={t('dashboard.overview.empty.title')}
          description={t('dashboard.overview.empty.description')}
          action={
            <Button asChild>
              <Link href={ROUTES.dashboard.projectNew}>
                <Plus className="size-4" aria-hidden />
                {t('dashboard.overview.empty.cta')}
              </Link>
            </Button>
          }
        />
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <DashboardOverview data={overview} />
    </PageTransition>
  );
}
