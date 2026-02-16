import { MoreHorizontal } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { DropdownMenu, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import type { UserSurvey } from '@/features/surveys/actions/get-user-surveys';
import type { useSurveyRow } from '@/features/surveys/hooks/use-survey-row';
import { cn } from '@/lib/common/utils';

import { Sparkline } from './sparkline';
import { SurveyActionMenuContent } from './survey-action-menu';
import { SurveyShareDialog } from './survey-share-dialog';
import { SurveyStatusBadge } from './survey-status-badge';

interface SurveyCardRowProps {
  survey: UserSurvey;
  isSelected: boolean;
  onSelect: (surveyId: string) => void;
  row: ReturnType<typeof useSurveyRow>;
  archivedLayout?: boolean;
}

export function SurveyCardRow({
  survey,
  isSelected,
  onSelect,
  row,
  archivedLayout = false,
}: SurveyCardRowProps) {
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
            <span className="text-foreground font-medium tabular-nums">{survey.questionCount}</span>
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
