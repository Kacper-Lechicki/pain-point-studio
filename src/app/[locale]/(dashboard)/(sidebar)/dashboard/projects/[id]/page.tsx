import { Construction } from 'lucide-react';

import { EmptyState } from '@/components/ui/empty-state';
import { PageTransition } from '@/components/ui/page-transition';
import { DashboardPageBack } from '@/features/dashboard/components/layout/dashboard-page-back';

interface ProjectDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  await params;

  return (
    <>
      <DashboardPageBack />

      <PageTransition>
        <EmptyState
          icon={Construction}
          title="Coming soon"
          description="Project detail view is being built. Check back later."
        />
      </PageTransition>
    </>
  );
}
