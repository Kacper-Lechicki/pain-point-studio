import { BarChart3 } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

import { EmptyState } from '@/components/ui/empty-state';
import { PageTransition } from '@/components/ui/page-transition';
import { getAnalyticsData } from '@/features/analytics/actions/get-analytics-data';
import { AnalyticsPanel } from '@/features/analytics/components/analytics-panel';

export default async function AnalyticsPage() {
  const [t, data] = await Promise.all([getTranslations(), getAnalyticsData()]);

  if (!data || data.surveyComparison.length === 0) {
    return (
      <PageTransition>
        <EmptyState
          icon={BarChart3}
          title={t('analytics.empty.title')}
          description={t('analytics.empty.description')}
        />
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <AnalyticsPanel data={data} />
    </PageTransition>
  );
}
