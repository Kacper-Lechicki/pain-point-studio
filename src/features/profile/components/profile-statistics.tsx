'use client';

import { Calendar, ClipboardList, type LucideIcon, MessageSquare, TrendingUp } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';

import type { ProfileStatistics } from '@/features/profile/actions/get-profile-statistics';

interface ProfileStatisticsSectionProps {
  statistics: ProfileStatistics;
}

export const ProfileStatisticsSection = ({ statistics }: ProfileStatisticsSectionProps) => {
  const t = useTranslations('profile.sections.statistics');
  const format = useFormatter();

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium">{t('title')}</h3>

      <div className="grid grid-cols-2 gap-2">
        <StatCard
          icon={ClipboardList}
          label={t('totalSurveys')}
          value={String(statistics.totalSurveys)}
        />

        <StatCard
          icon={MessageSquare}
          label={t('totalResponses')}
          value={String(statistics.totalResponses)}
        />

        <StatCard
          icon={TrendingUp}
          label={t('avgSubmissionRate')}
          value={`${statistics.avgSubmissionRate}%`}
        />

        <StatCard
          icon={Calendar}
          label={t('memberSince')}
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
  icon: LucideIcon;
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
