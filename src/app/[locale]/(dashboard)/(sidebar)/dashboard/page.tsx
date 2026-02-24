import { FolderKanban, Plus } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { PageTransition } from '@/components/ui/page-transition';
import { ROUTES } from '@/config';
import { getDashboardOverview } from '@/features/dashboard/actions/get-dashboard-overview';
import { getDashboardStats } from '@/features/dashboard/actions/get-dashboard-stats';
import { DashboardBento } from '@/features/dashboard/components/bento';
import { getProject } from '@/features/projects/actions/get-project';
import { getProfile } from '@/features/settings/actions/get-profile';
import Link from '@/i18n/link';

export const dynamic = 'force-dynamic';

interface Props {
  searchParams: Promise<{ period?: string }>;
}

export default async function DashboardPage({ searchParams }: Props) {
  const { period } = await searchParams;
  const days = period === '7' ? 7 : period === '90' ? 90 : period === '0' ? 0 : 30;

  const [overview, stats, profile, t] = await Promise.all([
    getDashboardOverview(),
    getDashboardStats(days),
    getProfile(),
    getTranslations(),
  ]);

  if (!overview || overview.projects.length === 0) {
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

  // Fetch pinned project details if set
  const pinnedProjectId = profile?.pinnedProjectId ?? null;
  const pinnedProject = pinnedProjectId ? await getProject(pinnedProjectId) : null;

  return (
    <PageTransition>
      <DashboardBento
        fullName={profile?.fullName ?? ''}
        stats={stats}
        projects={overview.projects}
        pinnedProject={pinnedProject}
        pinnedProjectId={pinnedProjectId}
        currentPeriod={String(days)}
      />
    </PageTransition>
  );
}
