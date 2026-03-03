'use client';

import { formatDistanceToNow } from 'date-fns';
import { Activity, CheckCircle, MessageSquare, Rocket } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Card, CardContent } from '@/components/ui/card';
import type { ActivityItem } from '@/features/dashboard/types/dashboard-stats';
import { getSurveyStatsUrl } from '@/features/surveys/lib/survey-urls';
import Link from '@/i18n/link';
import type { MessageKey } from '@/i18n/types';
import { cn } from '@/lib/common/utils';

// ── Icon mapping ────────────────────────────────────────────────────

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

// ── Component ───────────────────────────────────────────────────────

interface OverviewActivityListProps {
  items: ActivityItem[];
  maxItems?: number;
}

export function OverviewActivityList({ items, maxItems = 5 }: OverviewActivityListProps) {
  const t = useTranslations();
  const visibleItems = items.slice(0, maxItems);

  return (
    <Card className="gap-0 py-0 shadow-none">
      <CardContent className="flex min-h-0 flex-col gap-2 p-4">
        <div className="flex shrink-0 items-center justify-between gap-2">
          <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
            {t('projects.overview.recentActivity' as MessageKey)}
          </p>
          <Activity className="text-chart-pink size-4 shrink-0" aria-hidden />
        </div>

        {visibleItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
            <Activity className="text-muted-foreground/50 size-8 shrink-0" aria-hidden />
            <p className="text-muted-foreground text-sm">
              {t('projects.overview.noActivity' as MessageKey)}
            </p>
          </div>
        ) : (
          <div className="min-w-0">
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
                    {t(`projects.overview.activityType.${item.type}` as MessageKey)}
                  </span>
                  <span className="text-muted-foreground/60 shrink-0 text-xs">{relativeTime}</span>
                </Link>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
