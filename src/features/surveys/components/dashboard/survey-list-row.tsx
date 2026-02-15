'use client';

import { MoreHorizontal } from 'lucide-react';
import { useFormatter, useNow, useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { DropdownMenu, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { TableCell, TableRow } from '@/components/ui/table';
import type { UserSurvey } from '@/features/surveys/actions/get-user-surveys';
import { deriveSurveyFlags, getAvailableActions } from '@/features/surveys/config/survey-status';
import { useSurveyAction } from '@/features/surveys/hooks/use-survey-action';
import { useSurveyCardActions } from '@/features/surveys/hooks/use-survey-card-actions';
import { cn } from '@/lib/common/utils';

import { Sparkline, getSparklineColor } from './sparkline';
import { SurveyActionMenuContent } from './survey-action-menu';
import { SurveyStatusBadge } from './survey-status-badge';

// ── Component ───────────────────────────────────────────────────────

interface SurveyListRowProps {
  survey: UserSurvey;
  isSelected: boolean;
  onSelect: (surveyId: string) => void;
  onStatusChange: (surveyId: string, action: string) => void;
  variant?: 'table' | 'card';
  /** When true, table shows one "Archived" column instead of last response + activity; card shows 3 metrics (questions, responses, archived). */
  archivedLayout?: boolean;
}

export function SurveyListRow({
  survey,
  isSelected,
  onSelect,
  onStatusChange,
  variant = 'table',
  archivedLayout = false,
}: SurveyListRowProps) {
  const t = useTranslations();
  const format = useFormatter();
  const now = useNow();

  const { handleActionClick, confirmDialogProps } = useSurveyAction(survey.id, onStatusChange, t);
  const { handleShare, handleDuplicate } = useSurveyCardActions(survey.id, survey.slug);

  const { isDraft, isPending, isActive, isClosed, isArchived, canDuplicate } = deriveSurveyFlags(
    survey.status
  );
  const hasShareableLink = (isActive || isPending || isClosed) && !!survey.slug;

  const archivedAtLabel =
    isArchived && (survey.archivedAt ?? survey.updatedAt)
      ? format.relativeTime(new Date(survey.archivedAt ?? survey.updatedAt), now)
      : null;
  const sparklineColor = getSparklineColor(survey.recentActivity);
  const lastResponseLabel =
    survey.lastResponseAt != null
      ? format.relativeTime(new Date(survey.lastResponseAt), now)
      : null;
  const availableActions = getAvailableActions(survey.status);

  const tableRowInteraction = {
    onClick: () => onSelect(survey.id),
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
      flags={{ isDraft, isPending, canDuplicate, hasShareableLink }}
      availableActions={availableActions}
      onShare={handleShare}
      onDuplicate={handleDuplicate}
      handleActionClick={handleActionClick}
      onDetails={() => onSelect(survey.id)}
    />
  );

  const confirmDialogElement = confirmDialogProps && <ConfirmDialog {...confirmDialogProps} />;

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
              isArchived || archivedLayout ? 'grid-cols-3' : 'grid-cols-2'
            )}
          >
            <div className="flex flex-col gap-0.5">
              <span>{t('surveys.dashboard.table.questions')}</span>
              <span className="text-foreground font-medium tabular-nums">
                {survey.questionCount}
              </span>
            </div>
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
            {(isArchived || archivedLayout) && archivedAtLabel != null ? (
              <div className="flex flex-col gap-0.5">
                <span>{t('surveys.dashboard.table.archivedAt')}</span>
                <span className="text-foreground font-medium tabular-nums">{archivedAtLabel}</span>
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-0.5">
                  <span>{t('surveys.dashboard.table.lastResponse')}</span>
                  <span className="text-foreground font-medium tabular-nums">
                    {lastResponseLabel ?? '—'}
                  </span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span>{t('surveys.dashboard.table.activity')}</span>
                  <Sparkline
                    data={survey.recentActivity}
                    className={cn('shrink-0', sparklineColor)}
                  />
                </div>
              </>
            )}
          </div>
        </div>
        {confirmDialogElement}
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
        <TableCell className="border-border/30 min-w-0 border-l text-center">
          <SurveyStatusBadge status={survey.status} />
        </TableCell>
        <TableCell className="text-muted-foreground border-border/30 min-w-0 truncate border-l text-xs tabular-nums">
          {survey.questionCount}
        </TableCell>
        <TableCell className="text-muted-foreground border-border/30 min-w-0 truncate border-l text-xs tabular-nums">
          {survey.maxRespondents != null
            ? `${survey.completedCount}/${survey.maxRespondents}`
            : survey.completedCount}
        </TableCell>
        {archivedLayout && archivedAtLabel != null ? (
          <TableCell className="text-muted-foreground border-border/30 min-w-0 truncate border-l text-xs">
            {archivedAtLabel}
          </TableCell>
        ) : (
          <>
            <TableCell className="text-muted-foreground border-border/30 hidden min-w-0 truncate border-l pr-4 pl-3 text-xs lg:table-cell">
              {lastResponseLabel ?? '—'}
            </TableCell>
            <TableCell className="border-border/30 hidden min-w-0 border-l text-center xl:table-cell">
              <Sparkline
                data={survey.recentActivity}
                className={cn('mx-auto shrink-0', sparklineColor)}
              />
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
    </>
  );
}
