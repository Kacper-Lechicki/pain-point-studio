'use client';

import { Calendar, ClipboardList, MessageSquare, TrendingUp } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';

import type { ProfileStatistics } from '@/features/profile/actions/get-profile-statistics';

interface ProfileStatisticsSectionProps {
  statistics: ProfileStatistics;
}

export const ProfileStatisticsSection = ({ statistics }: ProfileStatisticsSectionProps) => {
  const t = useTranslations();
  const format = useFormatter();

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium">{t('profile.sections.statistics.title')}</h3>

      <div className="grid grid-cols-2 gap-2">
        <StatCard
          icon={ClipboardList}
          label={t('profile.sections.statistics.totalSurveys')}
          value={String(statistics.totalSurveys)}
        />
        <StatCard
          icon={MessageSquare}
          label={t('profile.sections.statistics.totalResponses')}
          value={String(statistics.totalResponses)}
        />
        <StatCard
          icon={TrendingUp}
          label={t('profile.sections.statistics.avgSubmissionRate')}
          value={`${statistics.avgSubmissionRate}%`}
        />
        <StatCard
          icon={Calendar}
          label={t('profile.sections.statistics.memberSince')}
          value={format.dateTime(new Date(statistics.memberSince), {
            month: 'short',
            year: 'numeric',
          })}
        />
      </div>
    </div>
  );
};

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
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
