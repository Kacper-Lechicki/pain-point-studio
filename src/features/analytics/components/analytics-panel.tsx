'use client';

import { CheckCircle, Hash, TrendingUp } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Separator } from '@/components/ui/separator';
import type { AnalyticsData } from '@/features/analytics/actions/get-analytics-data';
import { CategoryBreakdownChart } from '@/features/analytics/components/category-breakdown-chart';
import { SurveyComparisonTable } from '@/features/analytics/components/survey-comparison-table';
import { SectionLabel } from '@/features/surveys/components/shared/metric-display';
import { ResponseTimelineChart } from '@/features/surveys/components/shared/response-timeline-chart';

interface AnalyticsPanelProps {
  data: AnalyticsData;
}

export const AnalyticsPanel = ({ data }: AnalyticsPanelProps) => {
  const t = useTranslations();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-foreground text-3xl leading-tight font-bold">{t('analytics.title')}</h1>
        <p className="text-muted-foreground mt-1 text-sm">{t('analytics.description')}</p>
      </div>

      <Separator />

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <MetricCard value={data.totalResponses} label={t('analytics.totalResponses')} icon={Hash} />

        <MetricCard
          value={data.completedResponses}
          label={t('analytics.completedResponses')}
          icon={CheckCircle}
        />

        <MetricCard
          value={`${data.avgCompletionRate}%`}
          label={t('analytics.avgCompletionRate')}
          icon={TrendingUp}
        />
      </div>

      {data.responseTimeline.length > 0 && data.responseTimeline.some((v) => v > 0) && (
        <>
          <Separator />
          <SectionLabel>{t('analytics.responseTrends')}</SectionLabel>
          <ResponseTimelineChart data={data.responseTimeline} />
        </>
      )}

      {data.categoryBreakdown.length > 0 && (
        <>
          <Separator />
          <SectionLabel>{t('analytics.categoryBreakdown')}</SectionLabel>
          <CategoryBreakdownChart data={data.categoryBreakdown} />
        </>
      )}

      {data.surveyComparison.length > 0 && (
        <>
          <Separator />
          <SectionLabel>{t('analytics.surveyComparison')}</SectionLabel>
          <SurveyComparisonTable surveys={data.surveyComparison} />
        </>
      )}
    </div>
  );
};

function MetricCard({
  value,
  label,
  icon: Icon,
}: {
  value: string | number;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="border-border/50 rounded-md border px-3 py-2.5">
      <div className="text-foreground text-lg leading-none font-semibold tabular-nums">{value}</div>

      <div className="text-muted-foreground mt-1.5 flex items-center gap-1 text-[11px]">
        <Icon className="size-3" aria-hidden />
        {label}
      </div>
    </div>
  );
}
