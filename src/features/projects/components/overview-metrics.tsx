'use client';

import { formatDistanceToNow } from 'date-fns';
import { Activity, Clock3, FileText, Percent, Timer, Users } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { OverviewMetricCard } from '@/features/projects/components/overview-metric-card';
import type { ProjectOverviewStats } from '@/features/projects/types';

interface OverviewMetricsProps {
  stats: ProjectOverviewStats;
}

function formatDuration(seconds: number | null): string {
  if (seconds === null || seconds === 0) {
    return '\u2014';
  }

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  if (mins === 0) {
    return `${secs}s`;
  }

  return `${mins}m ${secs}s`;
}

function formatRelativeTime(timestamp: string | null): string {
  if (!timestamp) {
    return '\u2014';
  }

  return formatDistanceToNow(new Date(timestamp), { addSuffix: true }).replace(/^about /i, '');
}

export function OverviewMetrics({ stats }: OverviewMetricsProps) {
  const t = useTranslations('projects.detail.metrics');

  return (
    <div className="flex flex-col gap-2">
      <p className="text-muted-foreground text-[11px] font-medium tracking-wider uppercase">
        {t('sectionLabel')}
      </p>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        <OverviewMetricCard
          value={String(stats.totalSurveys)}
          label={t('totalSurveys')}
          icon={FileText}
        />
        <OverviewMetricCard
          value={String(stats.activeSurveys)}
          label={t('activeSurveys')}
          icon={Activity}
        />
        <OverviewMetricCard
          value={String(stats.totalResponses)}
          label={t('totalResponses')}
          icon={Users}
        />
        <OverviewMetricCard
          value={stats.totalResponses > 0 ? `${stats.avgCompletion}%` : '\u2014'}
          label={t('avgCompletion')}
          icon={Percent}
        />
        <OverviewMetricCard
          value={formatDuration(stats.avgTimeSeconds)}
          label={t('avgTime')}
          icon={Timer}
        />
        <OverviewMetricCard
          value={formatRelativeTime(stats.lastResponseAt)}
          label={t('lastResponse')}
          icon={Clock3}
        />
      </div>
    </div>
  );
}
