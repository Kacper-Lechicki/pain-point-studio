'use client';

import { formatDistanceToNow } from 'date-fns';
import { CheckCircle, MessageSquare, Rocket } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { SectionLabel } from '@/components/ui/metric-display';
import type { ActivityItem } from '@/features/dashboard/types/dashboard-stats';
import { getSurveyStatsUrl } from '@/features/surveys/lib/survey-urls';
import Link from '@/i18n/link';
import { cn } from '@/lib/common/utils';

const ACTIVITY_ICONS: Record<ActivityItem['type'], LucideIcon> = {
  response: MessageSquare,
  survey_completed: CheckCircle,
  survey_activated: Rocket,
};

const ACTIVITY_ICON_COLORS: Record<ActivityItem['type'], string> = {
  response: 'text-chart-cyan',
  survey_completed: 'text-chart-emerald',
  survey_activated: 'text-chart-violet',
};

interface OverviewRecentActivityProps {
  items: ActivityItem[];
}

export function OverviewRecentActivity({ items }: OverviewRecentActivityProps) {
  const t = useTranslations('projects.detail.recentActivity');
  const visibleItems = items.slice(0, 5);

  return (
    <div>
      <SectionLabel>{t('title')}</SectionLabel>
      {visibleItems.length === 0 ? (
        <div className="text-muted-foreground flex h-24 w-full items-center justify-center text-sm">
          {t('empty')}
        </div>
      ) : (
        <div className="mt-1 space-y-0">
          {visibleItems.map((item, index) => {
            const Icon = ACTIVITY_ICONS[item.type];
            const iconColor = ACTIVITY_ICON_COLORS[item.type];
            const relativeTime = formatDistanceToNow(new Date(item.timestamp), {
              addSuffix: true,
            }).replace(/^about /i, '');

            return (
              <Link
                key={`${item.surveyId}-${index}`}
                href={getSurveyStatsUrl(item.surveyId)}
                className="group flex items-center gap-2.5 py-1.5"
              >
                <div className="bg-muted/80 shrink-0 rounded-lg p-1.5">
                  <Icon className={cn(iconColor, 'size-3.5')} />
                </div>
                <span className="text-muted-foreground min-w-0 flex-1 truncate text-xs">
                  <span className="text-foreground font-medium group-hover:underline">
                    {item.title}
                  </span>
                  {' \u00b7 '}
                  {t(`type.${item.type}`)}
                </span>
                <span className="text-muted-foreground/60 shrink-0 text-xs">{relativeTime}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
