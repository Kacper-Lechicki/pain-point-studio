'use client';

import { CheckCircle, ClipboardList, MessageSquare } from 'lucide-react';
import { useTranslations } from 'next-intl';

import type { DashboardStats } from '@/features/dashboard/types/dashboard-stats';

import { KpiCard } from './kpi-card';

interface DashboardKpiCardsProps {
  stats: DashboardStats | null;
  projectCount: number;
  periodDays: number;
}

export function DashboardKpiCards({ stats, projectCount, periodDays }: DashboardKpiCardsProps) {
  const t = useTranslations('dashboard.bento');

  if (!stats) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:gap-5">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-muted h-[5.5rem] animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  const hasComparisonPeriod = periodDays === 7 || periodDays === 30 || periodDays === 90;

  // % deltas: when a period is selected, always show comparison (treat missing prev as 0)
  const responsesDelta = hasComparisonPeriod
    ? (() => {
        const prev = stats.prevTotalResponses ?? 0;

        if (prev > 0) {
          return Math.round(((stats.totalResponses - prev) / prev) * 100);
        }

        return stats.totalResponses > 0 ? 100 : 0;
      })()
    : null;

  const completionDelta = hasComparisonPeriod
    ? (() => {
        const prev = stats.prevAvgCompletionRate ?? 0;

        if (prev > 0) {
          return Math.round(((stats.avgCompletionRate - prev) / prev) * 100);
        }

        return stats.avgCompletionRate > 0 ? 100 : 0;
      })()
    : null;

  const activeSurveysDelta = hasComparisonPeriod
    ? (() => {
        const prev = stats.prevActiveSurveys ?? 0;

        if (prev > 0) {
          return Math.round(((stats.activeSurveys - prev) / prev) * 100);
        }

        return stats.activeSurveys > 0 ? 100 : 0;
      })()
    : null;

  // Subtitles — contextual secondary metrics
  const responsesPerDay = periodDays > 0 ? (stats.totalResponses / periodDays).toFixed(1) : null;
  const responsesSubtitle = responsesPerDay
    ? t('kpi.responsesPerDay', { avg: responsesPerDay })
    : undefined;
  const surveysSubtitle = t('kpi.acrossProjects', { count: projectCount });
  const completionSubtitle =
    periodDays > 0 ? t('kpi.lastNDays', { count: periodDays }) : t('kpi.allTime');

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:gap-5">
      <KpiCard
        title={t('kpi.totalResponses')}
        value={String(stats.totalResponses)}
        delta={responsesDelta}
        showZeroWhenNoData={hasComparisonPeriod}
        icon={MessageSquare}
        accent="cyan"
        {...(responsesSubtitle != null && { subtitle: responsesSubtitle })}
      />
      <KpiCard
        title={t('kpi.activeSurveys')}
        value={String(stats.activeSurveys)}
        delta={activeSurveysDelta}
        showZeroWhenNoData={hasComparisonPeriod}
        subtitle={surveysSubtitle}
        icon={ClipboardList}
        accent="violet"
      />
      <KpiCard
        title={t('kpi.avgCompletion')}
        value={`${stats.avgCompletionRate}%`}
        delta={completionDelta}
        showZeroWhenNoData={hasComparisonPeriod}
        subtitle={completionSubtitle}
        icon={CheckCircle}
        accent="pink"
      />
    </div>
  );
}
