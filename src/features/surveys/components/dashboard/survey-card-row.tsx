'use client';

import type React from 'react';

import { MoreHorizontal } from 'lucide-react';

import { SurveyStatusBadge } from '@/components/shared/survey-status-badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { DropdownMenu, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { SurveyActionMenuContent } from '@/features/surveys/components/dashboard/survey-action-menu';
import { SurveyMetricsGrid } from '@/features/surveys/components/dashboard/survey-metrics-grid';
import { SurveyProjectBadge } from '@/features/surveys/components/dashboard/survey-project-badge';
import { SurveyShareDialog } from '@/features/surveys/components/dashboard/survey-share-dialog';
import type { useSurveyRow } from '@/features/surveys/hooks/use-survey-row';
import type { UserSurvey } from '@/features/surveys/types';
import { cn } from '@/lib/common/utils';

interface SurveyCardRowProps {
  survey: UserSurvey;
  isSelected: boolean;
  onSelect: (surveyId: string) => void;
  row: ReturnType<typeof useSurveyRow>;
  archivedLayout?: boolean;
  isProjectContext?: boolean | undefined;
  isBulkSelected?: boolean | undefined;
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
          <SurveyMetricsGrid survey={survey} row={row} archivedLayout={archivedLayout} />
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
