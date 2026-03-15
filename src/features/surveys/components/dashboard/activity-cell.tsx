'use client';

import { Archive, Clock, Pencil, Trash2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { ActivityInfoTrigger } from '@/features/surveys/components/dashboard/activity-info-trigger';
import { Sparkline } from '@/features/surveys/components/dashboard/sparkline';
import { TRASH_RETENTION_DAYS } from '@/features/surveys/config';
import type { useSurveyRow } from '@/features/surveys/hooks/use-survey-row';
import type { UserSurvey } from '@/features/surveys/types';
import { cn } from '@/lib/common/utils';

const ACTIVITY_BADGE_BASE =
  'border-border bg-muted/90 inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium';

interface ActivityCellProps {
  survey: UserSurvey;
  row: ReturnType<typeof useSurveyRow>;
}

export function ActivityCell({ survey, row }: ActivityCellProps) {
  if (row.isTrashed) {
    return (
      <ActivityInfoTrigger
        titleKey="surveys.dashboard.activityInfo.deletedInDaysTitle"
        descriptionKey="surveys.dashboard.activityInfo.deletedInDaysDescription"
        descriptionValues={{
          days: row.trashedPurgeDays ?? TRASH_RETENTION_DAYS,
        }}
        className="flex shrink-0"
        dialogBadgeLabel={
          <>
            <Trash2 className="size-3 shrink-0" aria-hidden />
            <span className="truncate">
              {row.t('surveys.dashboard.table.deletedInDaysShort', {
                days: row.trashedPurgeDays ?? TRASH_RETENTION_DAYS,
              })}
            </span>
          </>
        }
        dialogBadgeClassName={cn(ACTIVITY_BADGE_BASE, 'text-red-700 dark:text-red-400')}
      >
        <Badge
          variant="secondary"
          className={cn(ACTIVITY_BADGE_BASE, 'text-red-700 dark:text-red-400')}
        >
          <Trash2 className="size-3 shrink-0" aria-hidden />
          <span className="truncate">
            {row.t('surveys.dashboard.table.deletedInDaysShort', {
              days: row.trashedPurgeDays ?? TRASH_RETENTION_DAYS,
            })}
          </span>
        </Badge>
      </ActivityInfoTrigger>
    );
  }

  if (row.isArchived) {
    if (row.autoDeleteDays != null) {
      return (
        <ActivityInfoTrigger
          titleKey="surveys.dashboard.activityInfo.autoDeletesTitle"
          descriptionKey="surveys.dashboard.activityInfo.autoDeletesInDays"
          descriptionValues={{ days: row.autoDeleteDays }}
          className="flex shrink-0"
          dialogBadgeLabel={
            <>
              <Archive className="size-3 shrink-0" aria-hidden />
              <span className="truncate">
                {row.t('surveys.dashboard.detailPanel.inDays', {
                  days: row.autoDeleteDays,
                })}
              </span>
            </>
          }
          dialogBadgeClassName={cn(ACTIVITY_BADGE_BASE, 'text-amber-700 dark:text-amber-400')}
        >
          <Badge
            variant="secondary"
            className={cn(ACTIVITY_BADGE_BASE, 'text-amber-700 dark:text-amber-400')}
          >
            <Archive className="size-3 shrink-0" aria-hidden />
            <span className="truncate">
              {row.t('surveys.dashboard.detailPanel.inDays', {
                days: row.autoDeleteDays,
              })}
            </span>
          </Badge>
        </ActivityInfoTrigger>
      );
    }

    return <>{'—'}</>;
  }

  if (row.isCompleted || row.isCancelled) {
    if (row.linkExpiryDays != null) {
      return (
        <ActivityInfoTrigger
          titleKey="surveys.dashboard.activityInfo.linkExpiresTitle"
          descriptionKey="surveys.dashboard.activityInfo.linkExpiresInDays"
          descriptionValues={{ days: row.linkExpiryDays }}
          className="flex shrink-0"
          dialogBadgeLabel={
            <>
              <Clock className="size-3 shrink-0" aria-hidden />
              <span className="truncate">
                {row.t('surveys.dashboard.table.deletedInDaysShort', {
                  days: row.linkExpiryDays,
                })}
              </span>
            </>
          }
          dialogBadgeClassName={cn(ACTIVITY_BADGE_BASE, 'text-violet-700 dark:text-violet-400')}
        >
          <Badge
            variant="secondary"
            className={cn(ACTIVITY_BADGE_BASE, 'text-violet-700 dark:text-violet-400')}
          >
            <Clock className="size-3 shrink-0" aria-hidden />
            <span className="truncate">
              {row.t('surveys.dashboard.table.deletedInDaysShort', {
                days: row.linkExpiryDays,
              })}
            </span>
          </Badge>
        </ActivityInfoTrigger>
      );
    }

    return <>{'—'}</>;
  }

  if (row.isDraft) {
    return (
      <ActivityInfoTrigger
        titleKey="surveys.dashboard.activityInfo.lastEditedTitle"
        descriptionKey="surveys.dashboard.activityInfo.lastEditedDescription"
        className="flex shrink-0"
        dialogBadgeLabel={
          <>
            <Pencil className="size-3 shrink-0" aria-hidden />
            <span className="truncate">{row.updatedAtLabel}</span>
          </>
        }
        dialogBadgeClassName={cn(ACTIVITY_BADGE_BASE, 'text-muted-foreground')}
      >
        <Badge variant="secondary" className={cn(ACTIVITY_BADGE_BASE, 'text-muted-foreground')}>
          <Pencil className="size-3 shrink-0" aria-hidden />
          <span className="truncate">{row.updatedAtLabel}</span>
        </Badge>
      </ActivityInfoTrigger>
    );
  }

  return (
    <ActivityInfoTrigger
      titleKey="surveys.dashboard.activityInfo.recentActivityTitle"
      descriptionKey="surveys.dashboard.activityInfo.recentActivityDescription"
      className="flex shrink-0"
    >
      <Sparkline
        data={survey.recentActivity}
        className={cn('mx-auto shrink-0', row.sparklineColor)}
      />
    </ActivityInfoTrigger>
  );
}
