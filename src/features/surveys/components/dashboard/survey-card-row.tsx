import type React from 'react';

import { Archive, Clock, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { DropdownMenu, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import type { UserSurvey } from '@/features/surveys/actions/get-user-surveys';
import { TRASH_RETENTION_DAYS } from '@/features/surveys/config';
import type { useSurveyRow } from '@/features/surveys/hooks/use-survey-row';
import { cn } from '@/lib/common/utils';

import { ActivityInfoTrigger } from './activity-info-trigger';
import { Sparkline } from './sparkline';
import { SurveyActionMenuContent } from './survey-action-menu';
import { SurveyProjectBadge } from './survey-project-badge';
import { SurveyShareDialog } from './survey-share-dialog';
import { SurveyStatusBadge } from './survey-status-badge';

interface SurveyCardRowProps {
  survey: UserSurvey;
  isSelected: boolean;
  onSelect: (surveyId: string) => void;
  row: ReturnType<typeof useSurveyRow>;
  archivedLayout?: boolean;
  /** When true, hides project badge and simplifies actions. */
  isProjectContext?: boolean | undefined;
  /** Whether this row's checkbox is checked (for bulk selection). */
  isBulkSelected?: boolean | undefined;
  /** Toggle bulk selection for this survey's ID. */
  onToggleBulkSelect?: ((id: string) => void) | undefined;
}

export function SurveyCardRow({
  survey,
  isSelected,
  onSelect,
  row,
  archivedLayout = false,
  isProjectContext,
  isBulkSelected,
  onToggleBulkSelect,
}: SurveyCardRowProps) {
  const menuContent = (
    <SurveyActionMenuContent
      surveyId={survey.id}
      flags={{
        isDraft: row.isDraft,
        isArchived: row.isArchived,
        isTrashed: row.isTrashed,
        hasShareableLink: row.hasShareableLink,
        questionCount: survey.questionCount,
      }}
      availableActions={row.availableActions}
      onShare={row.handleShare}
      handleActionClick={row.handleActionClick}
      {...(isProjectContext ? {} : { onDetails: () => onSelect(survey.id) })}
    />
  );

  return (
    <>
      <div
        className={cn(
          'border-border/50 bg-card flex min-w-0 flex-col gap-3 overflow-hidden rounded-lg border p-3 transition-all',
          isProjectContext && 'cursor-pointer',
          !isProjectContext && isSelected && 'ring-ring/20 border-ring/40 bg-muted/50 ring-2'
        )}
        {...(isProjectContext && {
          role: 'button',
          tabIndex: 0,
          onClick: (e: React.MouseEvent) => {
            if ((e.target as HTMLElement).closest?.('button')) {
              return;
            }

            onSelect(survey.id);
          },
          onKeyDown: (e: React.KeyboardEvent) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onSelect(survey.id);
            }
          },
        })}
      >
        <div className="flex min-w-0 items-start justify-between gap-2 overflow-hidden">
          {onToggleBulkSelect && (
            <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
              <Checkbox
                checked={isBulkSelected ?? false}
                onCheckedChange={() => onToggleBulkSelect(survey.id)}
                aria-label={row.t('surveys.dashboard.bulk.selectSurvey', { name: survey.title })}
              />
            </div>
          )}

          <div className="flex max-w-full min-w-0 flex-1 flex-col items-start gap-1 overflow-hidden">
            <span
              className="text-foreground block w-full max-w-full min-w-0 overflow-hidden text-sm font-semibold text-ellipsis whitespace-nowrap"
              title={survey.title}
            >
              {survey.title}
            </span>
            <SurveyStatusBadge
              status={survey.status}
              deletedAt={survey.deletedAt}
              className="shrink-0"
            />
          </div>

          <div className="relative z-10 shrink-0" onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="text-muted-foreground"
                  aria-label={row.t('surveys.dashboard.actions.moreActions')}
                  onClick={(e) => e.preventDefault()}
                >
                  <MoreHorizontal className="size-4" aria-hidden />
                </Button>
              </DropdownMenuTrigger>

              {menuContent}
            </DropdownMenu>
          </div>
        </div>

        <p className="text-muted-foreground -mt-1 line-clamp-1 min-h-4 min-w-0 overflow-hidden text-xs text-ellipsis">
          {survey.description || '\u00A0'}
        </p>

        {!isProjectContext && survey.projectId && (
          <SurveyProjectBadge projectId={survey.projectId} projectName={survey.projectName} />
        )}

        <div className="text-muted-foreground grid min-h-18 min-w-0 grid-cols-2 items-start gap-x-4 gap-y-2 text-xs">
          {row.isDraft ? (
            <>
              <div className="flex min-w-0 flex-col gap-0.5">
                <span>{row.t('surveys.dashboard.table.questions')}</span>
                <span className="text-foreground font-medium tabular-nums">
                  {survey.questionCount}
                </span>
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
                  className="text-muted-foreground flex min-w-0 items-start gap-1.5 text-left"
                >
                  <Pencil className="size-3.5 shrink-0" aria-hidden />
                  <span className="line-clamp-2 min-w-0 overflow-hidden leading-tight font-medium text-ellipsis">
                    {row.updatedAtLabel}
                  </span>
                </ActivityInfoTrigger>
              </div>
            </>
          ) : row.isTrashed ? (
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
                  className="flex min-w-0 items-start gap-1.5 text-left text-red-600 dark:text-red-400"
                >
                  <Trash2 className="size-3.5 shrink-0" aria-hidden />
                  <span className="line-clamp-2 min-w-0 overflow-hidden leading-tight font-medium wrap-break-word text-ellipsis tabular-nums">
                    {row.t('surveys.dashboard.table.deletedInDays', {
                      days: row.trashedPurgeDays ?? TRASH_RETENTION_DAYS,
                    })}
                  </span>
                </ActivityInfoTrigger>
              </div>
            </>
          ) : row.isArchived || archivedLayout ? (
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
                    className="flex min-w-0 items-start gap-1.5 text-left text-amber-700 dark:text-amber-400"
                  >
                    <Archive className="size-3.5 shrink-0" aria-hidden />
                    <span className="line-clamp-2 min-w-0 overflow-hidden leading-tight font-medium text-ellipsis tabular-nums">
                      {row.t('surveys.dashboard.detailPanel.inDays', {
                        days: row.autoDeleteDays,
                      })}
                    </span>
                  </ActivityInfoTrigger>
                ) : (
                  <span className="text-foreground font-medium tabular-nums">—</span>
                )}
              </div>
            </>
          ) : (
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
                      className="flex min-w-0 items-start gap-1.5 text-left text-violet-700 dark:text-violet-400"
                    >
                      <Clock className="size-3.5 shrink-0" aria-hidden />
                      <span className="line-clamp-2 min-w-0 overflow-hidden leading-tight font-medium wrap-break-word text-ellipsis tabular-nums">
                        {row.t('surveys.dashboard.detailPanel.linkExpires')}{' '}
                        {row.t('surveys.dashboard.detailPanel.inDays', {
                          days: row.linkExpiryDays,
                        })}
                      </span>
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
          )}
        </div>
      </div>

      {row.confirmDialogProps && <ConfirmDialog {...row.confirmDialogProps} />}

      {row.hasShareableLink && row.shareUrl && (
        <SurveyShareDialog
          open={row.shareDialogOpen}
          onOpenChange={row.setShareDialogOpen}
          shareUrl={row.shareUrl}
          surveyTitle={survey.title}
        />
      )}
    </>
  );
}
