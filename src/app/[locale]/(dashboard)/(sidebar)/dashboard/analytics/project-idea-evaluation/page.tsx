import { Construction } from 'lucide-react';

import { EmptyState } from '@/components/ui/empty-state';
import { PageTransition } from '@/components/ui/page-transition';

export default function ProjectIdeaEvaluationPage() {
  return (
    <PageTransition>
      <EmptyState
        icon={Construction}
        title="Coming soon"
        description="Cross-survey analytics are being built. Check back later."
      />
    </PageTransition>
  );
}
