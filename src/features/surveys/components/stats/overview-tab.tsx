'use client';

import dynamic from 'next/dynamic';

import { OverviewAlertBanner } from '@/features/surveys/components/stats/overview-alert-banner';
import { OverviewCompletionFunnel } from '@/features/surveys/components/stats/overview-completion-funnel';
import { OverviewDeviceSplit } from '@/features/surveys/components/stats/overview-device-split';
import { OverviewKpiCards } from '@/features/surveys/components/stats/overview-kpi-cards';
import { OverviewSetupGuide } from '@/features/surveys/components/stats/overview-setup-guide';
import { getOverviewAlert } from '@/features/surveys/lib/overview-alerts';
import type { SurveyStats } from '@/features/surveys/types';

const OverviewResponseTrend = dynamic(
  () =>
    import('@/features/surveys/components/stats/overview-response-trend').then(
      (mod) => mod.OverviewResponseTrend
    ),
  {
    loading: () => <div className="bg-card h-[240px] animate-pulse rounded-lg border" />,
  }
);

interface OverviewTabProps {
  stats: SurveyStats;
  shareUrl: string | null;
  onShare: () => void;
}

export function OverviewTab({ stats, shareUrl, onShare }: OverviewTabProps) {
  if (stats.totalResponses === 0) {
    return (
      <OverviewSetupGuide
        questionCount={stats.questions.length}
        surveyStatus={stats.survey.status}
        shareUrl={shareUrl}
        onShare={onShare}
      />
    );
  }

  const alert = getOverviewAlert(stats);

  return (
    <div className="flex flex-col gap-3">
      {alert && <OverviewAlertBanner alert={alert} />}

      <OverviewKpiCards
        viewCount={stats.viewCount}
        totalResponses={stats.totalResponses}
        completedResponses={stats.completedResponses}
        maxRespondents={stats.survey.maxRespondents}
        avgCompletionSeconds={stats.avgCompletionSeconds}
      />

      <div className="grid gap-3 lg:grid-cols-[3fr_2fr]">
        <OverviewResponseTrend timeline={stats.responseTimeline} />
        <OverviewDeviceSplit deviceTimeline={stats.deviceTimeline} />
      </div>

      <OverviewCompletionFunnel
        totalResponses={stats.totalResponses}
        completedResponses={stats.completedResponses}
        questions={stats.questions}
      />
    </div>
  );
}
