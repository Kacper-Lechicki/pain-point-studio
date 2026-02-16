'use client';

import { MoreHorizontal } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { DropdownMenu, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { TableCell, TableRow } from '@/components/ui/table';
import type { UserSurvey } from '@/features/surveys/actions/get-user-surveys';
import { useSurveyRow } from '@/features/surveys/hooks/use-survey-row';
import { cn } from '@/lib/common/utils';

import { Sparkline } from './sparkline';
import { SurveyActionMenuContent } from './survey-action-menu';
import { SurveyShareDialog } from './survey-share-dialog';
import { SurveyStatusBadge } from './survey-status-badge';

interface SurveyListRowProps {
  survey: UserSurvey;
  now: Date;
  isSelected: boolean;
  onSelect: (surveyId: string) => void;
  onStatusChange: (surveyId: string, action: string) => void;
  variant?: 'table' | 'card';
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
  const row = useSurveyRow(survey, now, onStatusChange);

  const menuContent = (
    <SurveyActionMenuContent
      surveyId={survey.id}
      flags={{
        isDraft: row.isDraft,
        isArchived: row.isArchived,
        hasShareableLink: row.hasShareableLink,
        questionCount: survey.questionCount,
      }}
      availableActions={row.availableActions}
      onShare={row.handleShare}
      handleActionClick={row.handleActionClick}
      onDetails={() => onSelect(survey.id)}
    />
  );

  const confirmDialogElement = row.confirmDialogProps && (
    <ConfirmDialog {...row.confirmDialogProps} />
  );
  const shareDialogElement = row.hasShareableLink && row.shareUrl && (
    <SurveyShareDialog
      open={row.shareDialogOpen}
      onOpenChange={row.setShareDialogOpen}
      shareUrl={row.shareUrl}
      surveyTitle={survey.title}
    />
  );

  if (variant === 'card') {
    return (
      <>
        <div
          className={cn(
            'border-border/50 flex min-w-0 flex-col gap-3 rounded-lg border p-3 transition-all',
            isSelected && 'ring-ring/20 border-ring/40 bg-muted/50 ring-2'
          )}
        >
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

          {survey.description && (
            <p className="text-muted-foreground -mt-1 line-clamp-1 text-xs">{survey.description}</p>
          )}

          <div
            className={cn(
              'text-muted-foreground grid gap-x-4 gap-y-2 text-xs',
              !row.isDraft && (row.isArchived || archivedLayout) ? 'grid-cols-3' : 'grid-cols-2'
            )}
          >
            <div className="flex flex-col gap-0.5">
              <span>{row.t('surveys.dashboard.table.questions')}</span>
              <span className="text-foreground font-medium tabular-nums">
                {survey.questionCount}
              </span>
            </div>
            {row.isDraft ? (
              <div className="flex flex-col gap-0.5">
                <span>{row.t('surveys.dashboard.table.lastEdited')}</span>
                <span className="text-foreground font-medium">{row.updatedAtLabel}</span>
              </div>
            ) : row.isArchived || archivedLayout ? (
              <>
                <div className="flex flex-col gap-0.5">
                  <span>{row.t('surveys.dashboard.table.archivedAt')}</span>
                  <span className="text-foreground font-medium">{row.archivedAtLabel ?? '—'}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span>{row.t('surveys.dashboard.table.autoDeletes')}</span>
                  <span className="text-foreground font-medium tabular-nums">
                    {row.autoDeleteDays != null
                      ? row.t('surveys.dashboard.detailPanel.inDays', { days: row.autoDeleteDays })
                      : '—'}
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="flex flex-col gap-0.5">
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
                <div className="flex flex-col gap-0.5">
                  <span>{row.t('surveys.dashboard.table.lastResponse')}</span>
                  <span className="text-foreground font-medium tabular-nums">
                    {row.lastResponseLabel ?? '—'}
                  </span>
                </div>
                {row.linkExpiryDays != null ? (
                  <div className="flex flex-col gap-0.5">
                    <span>{row.t('surveys.dashboard.detailPanel.linkExpires')}</span>
                    <span className="text-foreground font-medium tabular-nums">
                      {row.t('surveys.dashboard.detailPanel.inDays', { days: row.linkExpiryDays })}
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col gap-0.5">
                    <span>{row.t('surveys.dashboard.table.activity')}</span>
                    <Sparkline
                      data={survey.recentActivity}
                      className={cn('shrink-0', row.sparklineColor)}
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

  const tableRowInteraction = {
    onClick: () => {
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
              {row.archivedAtLabel ?? '—'}
            </TableCell>
            <TableCell className="text-muted-foreground border-border/30 min-w-0 truncate border-l text-xs tabular-nums">
              {row.autoDeleteDays != null
                ? row.t('surveys.dashboard.detailPanel.inDays', { days: row.autoDeleteDays })
                : '—'}
            </TableCell>
          </>
        ) : (
          <>
            <TableCell className="border-border/30 min-w-0 border-l text-center">
              <SurveyStatusBadge status={survey.status} />
            </TableCell>
            <TableCell className="text-muted-foreground border-border/30 min-w-0 truncate border-l text-xs tabular-nums">
              {row.isDraft
                ? '—'
                : survey.maxRespondents != null
                  ? `${survey.completedCount}/${survey.maxRespondents}`
                  : survey.completedCount}
            </TableCell>
            <TableCell className="text-muted-foreground border-border/30 hidden min-w-0 truncate border-l text-xs tabular-nums lg:table-cell">
              {survey.questionCount}
            </TableCell>
            <TableCell className="text-muted-foreground border-border/30 hidden min-w-0 truncate border-l pr-4 pl-3 text-xs xl:table-cell">
              {row.isDraft ? '—' : (row.lastResponseLabel ?? '—')}
            </TableCell>
            <TableCell className="border-border/30 hidden min-w-0 border-l text-center 2xl:table-cell">
              {row.isDraft || row.isCompleted || row.isCancelled ? (
                <span className="text-muted-foreground text-xs">—</span>
              ) : (
                <Sparkline
                  data={survey.recentActivity}
                  className={cn('mx-auto shrink-0', row.sparklineColor)}
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
                  aria-label={row.t('surveys.dashboard.actions.moreActions')}
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
