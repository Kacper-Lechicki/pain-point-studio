import { Construction } from 'lucide-react';

import { EmptyState } from '@/components/ui/empty-state';
import { PageTransition } from '@/components/ui/page-transition';

export default function DashboardPage() {
  return (
    <PageTransition>
      <EmptyState
        icon={Construction}
        title="Coming soon"
        description="The dashboard overview is being redesigned. Check back later."
      />
    </PageTransition>
  );
}
