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
  const t = useTranslations('analytics');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-foreground text-3xl leading-tight font-bold">{t('title')}</h1>
        <p className="text-muted-foreground mt-1 text-sm">{t('description')}</p>
      </div>

      <Separator />

      {/* Summary metrics */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <MetricCard value={data.totalResponses} label={t('totalResponses')} icon={Hash} />
        <MetricCard
          value={data.completedResponses}
          label={t('completedResponses')}
          icon={CheckCircle}
        />
        <MetricCard
          value={`${data.avgCompletionRate}%`}
          label={t('avgCompletionRate')}
          icon={TrendingUp}
        />
      </div>

      {/* Response trends */}
      {data.responseTimeline.length > 0 && data.responseTimeline.some((v) => v > 0) && (
        <>
          <Separator />
          <SectionLabel>{t('responseTrends')}</SectionLabel>
          <ResponseTimelineChart data={data.responseTimeline} />
        </>
      )}

      {/* Category breakdown */}
      {data.categoryBreakdown.length > 0 && (
        <>
          <Separator />
          <SectionLabel>{t('categoryBreakdown')}</SectionLabel>
          <CategoryBreakdownChart data={data.categoryBreakdown} />
        </>
      )}

      {/* Survey comparison */}
      {data.surveyComparison.length > 0 && (
        <>
          <Separator />
          <SectionLabel>{t('surveyComparison')}</SectionLabel>
          <SurveyComparisonTable surveys={data.surveyComparison} />
        </>
      )}
    </div>
  );
};

/* ---------- Internal metric card ---------- */

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
