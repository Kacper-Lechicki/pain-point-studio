'use client';

import { formatDistanceToNow } from 'date-fns';
import { Activity, CheckCircle, MessageSquare, Rocket } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Card } from '@/components/ui/card';
import { BENTO_CARD_CLASS } from '@/features/dashboard/components/bento/bento-styles';
import type { ActivityItem } from '@/features/dashboard/types/dashboard-stats';
import { cn } from '@/lib/common/utils';

const ACTIVITY_ICONS: Record<ActivityItem['type'], LucideIcon> = {
  response: MessageSquare,
  survey_completed: CheckCircle,
  survey_activated: Rocket,
};

interface DashboardRecentActivityProps {
  items: ActivityItem[];
}

export function DashboardRecentActivity({ items }: DashboardRecentActivityProps) {
  const t = useTranslations('dashboard.bento');
  const visibleItems = items.slice(0, 5);

  return (
    <Card className={cn('border-l-chart-pink h-full border-l-4', BENTO_CARD_CLASS)}>
      <div className="p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
            {t('recentActivity.title')}
          </p>
          <Activity className="text-chart-pink size-4 shrink-0" />
        </div>

        {visibleItems.length === 0 ? (
          <p className="text-muted-foreground mt-3 text-center text-xs">
            {t('recentActivity.empty')}
          </p>
        ) : (
          <div className="mt-2">
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
                    {t(`recentActivity.type.${item.type}`)}
                  </span>
                  <span className="text-muted-foreground/60 shrink-0 text-xs">{relativeTime}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Card>
  );
}
