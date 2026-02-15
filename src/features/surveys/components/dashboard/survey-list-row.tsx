'use client';

import { MoreHorizontal } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { DropdownMenu, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { TableCell, TableRow } from '@/components/ui/table';
import type { UserSurvey } from '@/features/surveys/actions/get-user-surveys';
import { SURVEY_RETENTION_DAYS } from '@/features/surveys/config';
import { deriveSurveyFlags, getAvailableActions } from '@/features/surveys/config/survey-status';
import { useSurveyAction } from '@/features/surveys/hooks/use-survey-action';
import { useSurveyCardActions } from '@/features/surveys/hooks/use-survey-card-actions';
import { daysUntilExpiry } from '@/features/surveys/lib/calculations';
import { cn } from '@/lib/common/utils';

import { Sparkline, getSparklineColor } from './sparkline';
import { SurveyActionMenuContent } from './survey-action-menu';
import { SurveyShareDialog } from './survey-share-dialog';
import { SurveyStatusBadge } from './survey-status-badge';

// ── Component ───────────────────────────────────────────────────────

interface SurveyListRowProps {
  survey: UserSurvey;
  /** Shared clock from the parent list — keeps relative times consistent across rows and the detail panel. */
  now: Date;
  isSelected: boolean;
  onSelect: (surveyId: string) => void;
  onStatusChange: (surveyId: string, action: string) => void;
  variant?: 'table' | 'card';
  /** When true, table shows one "Archived" column instead of last response + activity; card shows 3 metrics (questions, responses, archived). */
  archivedLayout?: boolean;
}

export function SurveyListRow({
  survey,
  now,
  isSelected,
  onSelect,
  onStatusChange,
  variant = 'table',
  archivedLayout = false,
}: SurveyListRowProps) {
  const t = useTranslations();
  const format = useFormatter();

  const { handleActionClick, confirmDialogProps } = useSurveyAction(survey.id, onStatusChange, t);
  const { shareUrl, shareDialogOpen, setShareDialogOpen, handleShare } = useSurveyCardActions(
    survey.slug
  );

  const { isDraft, isActive, isCompleted, isCancelled, isArchived } = deriveSurveyFlags(
    survey.status
  );
  const hasShareableLink = (isActive || isCompleted || isCancelled) && !!survey.slug;

  const archivedAtLabel =
    isArchived && (survey.archivedAt ?? survey.updatedAt)
      ? format.relativeTime(new Date(survey.archivedAt ?? survey.updatedAt), now)
      : null;
  const sparklineColor = getSparklineColor(survey.recentActivity);
  const updatedAtLabel = format.relativeTime(new Date(survey.updatedAt), now);
  const lastResponseLabel =
    survey.lastResponseAt != null
      ? format.relativeTime(new Date(survey.lastResponseAt), now)
      : null;
  const availableActions = getAvailableActions(survey.status);

  const tableRowInteraction = {
    onClick: () => {
      /* Ignore clicks that fire while a dialog overlay is mounted (e.g. the
         status-info modal). Radix dismisses the overlay on pointerdown, but
         the subsequent click still reaches the row underneath. */
      if (document.querySelector('[data-slot="dialog-overlay"]')) {
        return;
      }

      onSelect(survey.id);
    },
    role: 'button' as const,
    tabIndex: 0,
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onSelect(survey.id);
      }
    },
    'aria-pressed': isSelected,
    'aria-label': survey.title,
  };

  // ── Shared menu + confirm dialog ─────────────────────────────────

  const menuContent = (
    <SurveyActionMenuContent
      surveyId={survey.id}
      flags={{ isDraft, isArchived, hasShareableLink, questionCount: survey.questionCount }}
      availableActions={availableActions}
      onShare={handleShare}
      handleActionClick={handleActionClick}
      onDetails={() => onSelect(survey.id)}
    />
  );

  const confirmDialogElement = confirmDialogProps && <ConfirmDialog {...confirmDialogProps} />;
  const shareDialogElement = hasShareableLink && shareUrl && (
    <SurveyShareDialog
      open={shareDialogOpen}
      onOpenChange={setShareDialogOpen}
      shareUrl={shareUrl}
      surveyTitle={survey.title}
    />
  );

  // ── Card variant ────────────────────────────────────────────────

  if (variant === 'card') {
    return (
      <>
        <div
          className={cn(
            'border-border/50 flex min-w-0 flex-col gap-3 rounded-lg border p-3 transition-all',
            isSelected && 'ring-ring/20 border-ring/40 bg-muted/50 ring-2'
          )}
        >
          {/* Header: title + badge + menu */}
          <div className="flex min-w-0 items-start justify-between gap-2">
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1">
              <span className="text-foreground truncate text-sm font-semibold">{survey.title}</span>
              <SurveyStatusBadge status={survey.status} className="shrink-0" />
            </div>
            <div className="shrink-0">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    className="text-muted-foreground"
                    aria-label={t('surveys.dashboard.actions.moreActions')}
                    onClick={(e) => e.preventDefault()}
                  >
                    <MoreHorizontal className="size-4" aria-hidden />
                  </Button>
                </DropdownMenuTrigger>
                {menuContent}
              </DropdownMenu>
            </div>
          </div>

          {/* Description snippet */}
          {survey.description && (
            <p className="text-muted-foreground -mt-1 line-clamp-1 text-xs">{survey.description}</p>
          )}

          {/* Metrics grid */}
          <div
            className={cn(
              'text-muted-foreground grid gap-x-4 gap-y-2 text-xs',
              !isDraft && (isArchived || archivedLayout) ? 'grid-cols-3' : 'grid-cols-2'
            )}
          >
            <div className="flex flex-col gap-0.5">
              <span>{t('surveys.dashboard.table.questions')}</span>
              <span className="text-foreground font-medium tabular-nums">
                {survey.questionCount}
              </span>
            </div>
            {isDraft ? (
              <div className="flex flex-col gap-0.5">
                <span>{t('surveys.dashboard.table.lastEdited')}</span>
                <span className="text-foreground font-medium">{updatedAtLabel}</span>
              </div>
            ) : isArchived || archivedLayout ? (
              <>
                <div className="flex flex-col gap-0.5">
                  <span>{t('surveys.dashboard.table.archivedAt')}</span>
                  <span className="text-foreground font-medium">{archivedAtLabel ?? '—'}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span>{t('surveys.dashboard.table.autoDeletes')}</span>
                  <span className="text-foreground font-medium tabular-nums">
                    {(() => {
                      const days = daysUntilExpiry(survey.archivedAt, SURVEY_RETENTION_DAYS);

                      return days != null
                        ? t('surveys.dashboard.detailPanel.inDays', { days })
                        : '—';
                    })()}
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="flex flex-col gap-0.5">
                  <span>{t('surveys.dashboard.table.responses')}</span>
                  <span className="text-foreground font-medium tabular-nums">
                    {survey.maxRespondents != null
                      ? t('surveys.dashboard.card.responsesOfMax', {
                          completed: survey.completedCount,
                          max: survey.maxRespondents,
                        })
                      : survey.completedCount}
                  </span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span>{t('surveys.dashboard.table.lastResponse')}</span>
                  <span className="text-foreground font-medium tabular-nums">
                    {lastResponseLabel ?? '—'}
                  </span>
                </div>
                {isCompleted || isCancelled ? (
                  (() => {
                    const timestamp = isCompleted ? survey.completedAt : survey.cancelledAt;
                    const days = daysUntilExpiry(timestamp, SURVEY_RETENTION_DAYS);

                    return days != null ? (
                      <div className="flex flex-col gap-0.5">
                        <span>{t('surveys.dashboard.detailPanel.linkExpires')}</span>
                        <span className="text-foreground font-medium tabular-nums">
                          {t('surveys.dashboard.detailPanel.inDays', { days })}
                        </span>
                      </div>
                    ) : null;
                  })()
                ) : (
                  <div className="flex flex-col gap-0.5">
                    <span>{t('surveys.dashboard.table.activity')}</span>
                    <Sparkline
                      data={survey.recentActivity}
                      className={cn('shrink-0', sparklineColor)}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
        {confirmDialogElement}
        {shareDialogElement}
      </>
    );
  }

  // ── Table variant ───────────────────────────────────────────────

  return (
    <>
      <TableRow
        className={cn(
          'even:bg-muted/80 h-14 cursor-pointer transition-all',
          isSelected && 'bg-muted/60 even:bg-muted/60'
        )}
        {...tableRowInteraction}
      >
        <TableCell className="min-w-0 overflow-hidden py-2.5">
          <span className="text-foreground block truncate text-sm font-semibold">
            {survey.title}
          </span>
          {survey.description && (
            <p className="text-muted-foreground mt-0.5 truncate text-[11px]">
              {survey.description}
            </p>
          )}
        </TableCell>
        {archivedLayout ? (
          <>
            <TableCell className="text-muted-foreground border-border/30 min-w-0 truncate border-l text-xs tabular-nums">
              {survey.questionCount}
            </TableCell>
            <TableCell className="text-muted-foreground border-border/30 min-w-0 truncate border-l text-xs">
              {archivedAtLabel ?? '—'}
            </TableCell>
            <TableCell className="text-muted-foreground border-border/30 min-w-0 truncate border-l text-xs tabular-nums">
              {(() => {
                const days = daysUntilExpiry(survey.archivedAt, SURVEY_RETENTION_DAYS);

                return days != null ? t('surveys.dashboard.detailPanel.inDays', { days }) : '—';
              })()}
            </TableCell>
          </>
        ) : (
          <>
            <TableCell className="border-border/30 min-w-0 border-l text-center">
              <SurveyStatusBadge status={survey.status} />
            </TableCell>
            <TableCell className="text-muted-foreground border-border/30 min-w-0 truncate border-l text-xs tabular-nums">
              {isDraft
                ? '—'
                : survey.maxRespondents != null
                  ? `${survey.completedCount}/${survey.maxRespondents}`
                  : survey.completedCount}
            </TableCell>
            <TableCell className="text-muted-foreground border-border/30 hidden min-w-0 truncate border-l text-xs tabular-nums lg:table-cell">
              {survey.questionCount}
            </TableCell>
            <TableCell className="text-muted-foreground border-border/30 hidden min-w-0 truncate border-l pr-4 pl-3 text-xs xl:table-cell">
              {isDraft ? '—' : (lastResponseLabel ?? '—')}
            </TableCell>
            <TableCell className="border-border/30 hidden min-w-0 border-l text-center 2xl:table-cell">
              {isDraft || isCompleted || isCancelled ? (
                <span className="text-muted-foreground text-xs">—</span>
              ) : (
                <Sparkline
                  data={survey.recentActivity}
                  className={cn('mx-auto shrink-0', sparklineColor)}
                />
              )}
            </TableCell>
          </>
        )}
        <TableCell className="w-10 p-0" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="text-muted-foreground"
                  aria-label={t('surveys.dashboard.actions.moreActions')}
                  onClick={(e) => e.preventDefault()}
                >
                  <MoreHorizontal className="size-4" aria-hidden />
                </Button>
              </DropdownMenuTrigger>
              {menuContent}
            </DropdownMenu>
          </div>
        </TableCell>
      </TableRow>
      {confirmDialogElement}
      {shareDialogElement}
    </>
  );
}
