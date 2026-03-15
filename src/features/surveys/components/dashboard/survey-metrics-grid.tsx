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
  'border-border bg-muted/90 inline-flex w-fit items-center gap-1.5 px-2 py-0.5 text-[11px] font-medium';

interface SurveyMetricsGridProps {
  survey: UserSurvey;
  row: ReturnType<typeof useSurveyRow>;
  archivedLayout: boolean;
}

export function SurveyMetricsGrid({ survey, row, archivedLayout }: SurveyMetricsGridProps) {
  if (row.isDraft) {
    return (
      <>
        <div className="flex min-w-0 flex-col gap-0.5">
          <span>{row.t('surveys.dashboard.table.questions')}</span>
          <span className="text-foreground font-medium tabular-nums">{survey.questionCount}</span>
        </div>
        <div className="flex min-w-0 flex-col gap-0.5">
          <span>{row.t('surveys.dashboard.table.responses')}</span>
          <span className="text-foreground font-medium tabular-nums">—</span>
        </div>
        <div className="flex min-w-0 flex-col gap-0.5">
          <span>{row.t('surveys.dashboard.table.lastEdited')}</span>
          <span className="text-foreground font-medium">{row.updatedAtLabel}</span>
        </div>
        <div className="flex min-w-0 flex-col gap-0.5">
          <span>{row.t('surveys.dashboard.table.activity')}</span>
          <ActivityInfoTrigger
            titleKey="surveys.dashboard.activityInfo.lastEditedTitle"
            descriptionKey="surveys.dashboard.activityInfo.lastEditedDescription"
            className="flex min-w-0"
            dialogBadgeLabel={
              <>
                <Pencil className="size-3.5 shrink-0" aria-hidden />
                <span className="line-clamp-2 min-w-0 overflow-hidden leading-tight text-ellipsis">
                  {row.updatedAtLabel}
                </span>
              </>
            }
            dialogBadgeClassName={cn(ACTIVITY_BADGE_BASE, 'text-muted-foreground')}
          >
            <Badge variant="secondary" className={cn(ACTIVITY_BADGE_BASE, 'text-muted-foreground')}>
              <Pencil className="size-3.5 shrink-0" aria-hidden />
              <span className="line-clamp-2 min-w-0 overflow-hidden leading-tight text-ellipsis">
                {row.updatedAtLabel}
              </span>
            </Badge>
          </ActivityInfoTrigger>
        </div>
      </>
    );
  }

  if (row.isTrashed) {
    return (
      <>
        <div className="min-w-0" />
        <div className="min-w-0" />
        <div className="min-w-0" />
        <div className="flex min-w-0 flex-col gap-0.5">
          <span>{row.t('surveys.dashboard.table.activity')}</span>
          <ActivityInfoTrigger
            titleKey="surveys.dashboard.activityInfo.deletedInDaysTitle"
            descriptionKey="surveys.dashboard.activityInfo.deletedInDaysDescription"
            descriptionValues={{
              days: row.trashedPurgeDays ?? TRASH_RETENTION_DAYS,
            }}
            className="flex min-w-0"
            dialogBadgeLabel={
              <>
                <Trash2 className="size-3.5 shrink-0" aria-hidden />
                <span className="line-clamp-2 min-w-0 overflow-hidden leading-tight text-ellipsis">
                  {row.t('surveys.dashboard.table.deletedInDaysShort', {
                    days: row.trashedPurgeDays ?? TRASH_RETENTION_DAYS,
                  })}
                </span>
              </>
            }
            dialogBadgeClassName={cn(
              ACTIVITY_BADGE_BASE,
              'tabular-nums text-red-700 dark:text-red-400'
            )}
          >
            <Badge
              variant="secondary"
              className={cn(ACTIVITY_BADGE_BASE, 'text-red-700 tabular-nums dark:text-red-400')}
            >
              <Trash2 className="size-3.5 shrink-0" aria-hidden />
              <span className="line-clamp-2 min-w-0 overflow-hidden leading-tight text-ellipsis">
                {row.t('surveys.dashboard.table.deletedInDaysShort', {
                  days: row.trashedPurgeDays ?? TRASH_RETENTION_DAYS,
                })}
              </span>
            </Badge>
          </ActivityInfoTrigger>
        </div>
      </>
    );
  }

  if (row.isArchived || archivedLayout) {
    return (
      <>
        <div className="flex min-w-0 flex-col gap-0.5">
          <span>{row.t('surveys.dashboard.table.completion')}</span>
          <span className="text-foreground font-medium tabular-nums">
            {survey.avgQuestionCompletion != null
              ? `${Math.round(survey.avgQuestionCompletion)}%`
              : '—'}
          </span>
        </div>
        <div className="flex min-w-0 flex-col gap-0.5">
          <span>{row.t('surveys.dashboard.table.archivedAt')}</span>
          <span className="text-foreground font-medium">{row.archivedAtLabel ?? '—'}</span>
        </div>
        <div className="min-w-0" />
        <div className="flex min-w-0 flex-col gap-0.5">
          <span>{row.t('surveys.dashboard.table.activity')}</span>
          {row.autoDeleteDays != null ? (
            <ActivityInfoTrigger
              titleKey="surveys.dashboard.activityInfo.autoDeletesTitle"
              descriptionKey="surveys.dashboard.activityInfo.autoDeletesInDays"
              descriptionValues={{ days: row.autoDeleteDays }}
              className="flex min-w-0"
              dialogBadgeLabel={
                <>
                  <Archive className="size-3.5 shrink-0" aria-hidden />
                  <span className="line-clamp-2 min-w-0 overflow-hidden leading-tight text-ellipsis">
                    {row.t('surveys.dashboard.detailPanel.inDays', {
                      days: row.autoDeleteDays,
                    })}
                  </span>
                </>
              }
              dialogBadgeClassName={cn(
                ACTIVITY_BADGE_BASE,
                'tabular-nums text-amber-700 dark:text-amber-400'
              )}
            >
              <Badge
                variant="secondary"
                className={cn(
                  ACTIVITY_BADGE_BASE,
                  'text-amber-700 tabular-nums dark:text-amber-400'
                )}
              >
                <Archive className="size-3.5 shrink-0" aria-hidden />
                <span className="line-clamp-2 min-w-0 overflow-hidden leading-tight text-ellipsis">
                  {row.t('surveys.dashboard.detailPanel.inDays', {
                    days: row.autoDeleteDays,
                  })}
                </span>
              </Badge>
            </ActivityInfoTrigger>
          ) : (
            <span className="text-foreground font-medium tabular-nums">—</span>
          )}
        </div>
      </>
    );
  }

  return (
    <>
      <div className="flex min-w-0 flex-col gap-0.5">
        <span>{row.t('surveys.dashboard.table.completion')}</span>
        <span className="text-foreground font-medium tabular-nums">
          {survey.avgQuestionCompletion != null
            ? `${Math.round(survey.avgQuestionCompletion)}%`
            : '—'}
        </span>
      </div>
      <div className="flex min-w-0 flex-col gap-0.5">
        <span>{row.t('surveys.dashboard.table.responses')}</span>
        <span className="text-foreground font-medium tabular-nums">
          {survey.maxRespondents != null
            ? row.t('surveys.dashboard.card.responsesOfMax', {
                completed: survey.completedCount,
                max: survey.maxRespondents,
              })
            : survey.completedCount}
        </span>
      </div>
      <div className="flex min-w-0 flex-col gap-0.5">
        <span>{row.t('surveys.dashboard.table.lastResponse')}</span>
        <span className="text-foreground font-medium tabular-nums">
          {row.lastResponseLabel ?? '—'}
        </span>
      </div>
      <div className="flex min-w-0 flex-col gap-0.5">
        <span>{row.t('surveys.dashboard.table.activity')}</span>
        {row.isCompleted || row.isCancelled ? (
          row.linkExpiryDays != null ? (
            <ActivityInfoTrigger
              titleKey="surveys.dashboard.activityInfo.linkExpiresTitle"
              descriptionKey="surveys.dashboard.activityInfo.linkExpiresInDays"
              descriptionValues={{ days: row.linkExpiryDays }}
              className="flex min-w-0"
              dialogBadgeLabel={
                <>
                  <Clock className="size-3.5 shrink-0" aria-hidden />
                  <span className="line-clamp-2 min-w-0 overflow-hidden leading-tight text-ellipsis">
                    {row.t('surveys.dashboard.table.deletedInDaysShort', {
                      days: row.linkExpiryDays,
                    })}
                  </span>
                </>
              }
              dialogBadgeClassName={cn(
                ACTIVITY_BADGE_BASE,
                'tabular-nums text-violet-700 dark:text-violet-400'
              )}
            >
              <Badge
                variant="secondary"
                className={cn(
                  ACTIVITY_BADGE_BASE,
                  'text-violet-700 tabular-nums dark:text-violet-400'
                )}
              >
                <Clock className="size-3.5 shrink-0" aria-hidden />
                <span className="line-clamp-2 min-w-0 overflow-hidden leading-tight text-ellipsis">
                  {row.t('surveys.dashboard.table.deletedInDaysShort', {
                    days: row.linkExpiryDays,
                  })}
                </span>
              </Badge>
            </ActivityInfoTrigger>
          ) : (
            <span className="text-foreground font-medium tabular-nums">—</span>
          )
        ) : (
          <ActivityInfoTrigger
            titleKey="surveys.dashboard.activityInfo.recentActivityTitle"
            descriptionKey="surveys.dashboard.activityInfo.recentActivityDescription"
            className="flex shrink-0"
          >
            <Sparkline
              data={survey.recentActivity}
              className={cn('shrink-0', row.sparklineColor)}
            />
          </ActivityInfoTrigger>
        )}
      </div>
    </>
  );
}
