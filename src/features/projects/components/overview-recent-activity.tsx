'use client';

import { formatDistanceToNow } from 'date-fns';
import { Activity, CheckCircle, MessageSquare, Rocket } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Card, CardContent } from '@/components/ui/card';
import type { ActivityItem } from '@/features/dashboard/types/dashboard-stats';

const ACTIVITY_ICONS: Record<ActivityItem['type'], LucideIcon> = {
  response: MessageSquare,
  survey_completed: CheckCircle,
  survey_activated: Rocket,
};

interface OverviewRecentActivityProps {
  items: ActivityItem[];
}

export function OverviewRecentActivity({ items }: OverviewRecentActivityProps) {
  const t = useTranslations('projects.detail.recentActivity');
  const visibleItems = items.slice(0, 5);

  return (
    <Card className="flex h-full min-w-0 flex-col">
      <CardContent className="flex min-h-0 flex-1 flex-col gap-2 px-4 pt-4 pb-4">
        <div className="flex shrink-0 items-center justify-between gap-2">
          <p className="text-muted-foreground text-[11px] font-medium tracking-wider uppercase">
            {t('title')}
          </p>
          <Activity className="text-chart-pink size-4 shrink-0" />
        </div>

        {visibleItems.length === 0 ? (
          <div className="text-muted-foreground flex min-h-52 flex-1 items-center justify-center text-sm">
            {t('empty')}
          </div>
        ) : (
          <div className="mt-1">
            {visibleItems.map((item, index) => {
              const Icon = ACTIVITY_ICONS[item.type];
              const relativeTime = formatDistanceToNow(new Date(item.timestamp), {
                addSuffix: true,
              }).replace(/^about /i, '');

              return (
                <div key={`${item.surveyId}-${index}`} className="flex items-center gap-2.5 py-1.5">
                  <div className="bg-muted/80 shrink-0 rounded-lg p-1.5">
                    <Icon className="text-muted-foreground size-3.5" />
                  </div>
                  <span className="text-muted-foreground min-w-0 truncate text-xs">
                    <span className="text-foreground font-medium">{item.title}</span>
                    {' \u00b7 '}
                    {t(`type.${item.type}`)}
                  </span>
                  <span className="text-muted-foreground/60 ml-auto shrink-0 text-xs">
                    {relativeTime}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
