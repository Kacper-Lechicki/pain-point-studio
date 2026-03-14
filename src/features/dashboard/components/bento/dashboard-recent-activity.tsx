'use client';

import { formatDistanceToNow } from 'date-fns';
import { Activity, CheckCircle, MessageSquare, Rocket } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import {
  BENTO_CARD_CLASS,
  BENTO_EMPTY_STATE_MIN_H,
} from '@/features/dashboard/components/bento/bento-styles';
import { BENTO_VISIBLE_ITEMS } from '@/features/dashboard/config/layout';
import type { ActivityItem } from '@/features/dashboard/types/dashboard-stats';
import Link from '@/i18n/link';
import { getSurveyStatsUrl } from '@/lib/common/urls/survey-urls';
import { cn } from '@/lib/common/utils';

const ACTIVITY_ICONS: Record<ActivityItem['type'], LucideIcon> = {
  response: MessageSquare,
  survey_completed: CheckCircle,
  survey_activated: Rocket,
  survey_started: Rocket,
};

const ACTIVITY_ICON_COLORS: Record<ActivityItem['type'], string> = {
  response: 'text-chart-cyan',
  survey_completed: 'text-chart-emerald',
  survey_activated: 'text-chart-violet',
  survey_started: 'text-chart-violet',
};

interface DashboardRecentActivityProps {
  items: ActivityItem[];
}

export function DashboardRecentActivity({ items }: DashboardRecentActivityProps) {
  const t = useTranslations('dashboard.bento');
  const visibleItems = items.slice(0, BENTO_VISIBLE_ITEMS);

  return (
    <Card className={cn('border-l-chart-pink h-full border-l-4', BENTO_CARD_CLASS)}>
      <div className="flex h-full flex-col gap-2 p-4">
        <div className="flex shrink-0 items-center justify-between gap-2">
          <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
            {t('recentActivity.title')}
          </p>
          <Activity className="text-chart-pink size-4 shrink-0" />
        </div>

        {visibleItems.length === 0 ? (
          <EmptyState
            variant="card"
            accent="pink"
            icon={Activity}
            title={t('recentActivity.empty')}
            description={t('recentActivity.emptyDescription')}
            className={cn('flex-1 justify-center', BENTO_EMPTY_STATE_MIN_H)}
          />
        ) : (
          <div className="min-w-0 flex-1">
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
                    <span className="text-foreground font-medium md:group-hover:underline">
                      {item.title}
                    </span>
                    {' \u00b7 '}
                    {t(`recentActivity.type.${item.type}`)}
                  </span>
                  <span className="text-muted-foreground/60 shrink-0 text-xs">{relativeTime}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </Card>
  );
}
