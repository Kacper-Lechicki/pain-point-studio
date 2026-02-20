import type React from 'react';

import { MoreHorizontal } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { DropdownMenu, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { TableCell, TableRow } from '@/components/ui/table';
import type { UserSurvey } from '@/features/surveys/actions/get-user-surveys';
import { Sparkline } from '@/features/surveys/components/dashboard/sparkline';
import { SurveyActionMenuContent } from '@/features/surveys/components/dashboard/survey-action-menu';
import { SurveyShareDialog } from '@/features/surveys/components/dashboard/survey-share-dialog';
import { SurveyStatusBadge } from '@/features/surveys/components/dashboard/survey-status-badge';
import { ExportDialog } from '@/features/surveys/components/stats/export-dialog';
import type { useSurveyRow } from '@/features/surveys/hooks/use-survey-row';
import { cn } from '@/lib/common/utils';

interface SurveyTableRowProps {
  survey: UserSurvey;
  isSelected: boolean;
  onSelect: (surveyId: string) => void;
  row: ReturnType<typeof useSurveyRow>;
  archivedLayout?: boolean;
}

export function SurveyTableRow({
  survey,
  isSelected,
  onSelect,
  row,
  archivedLayout = false,
}: SurveyTableRowProps) {
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
      onExport={row.canExport ? row.handleExport : undefined}
      handleActionClick={row.handleActionClick}
      onDetails={() => onSelect(survey.id)}
    />
  );

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

      {row.confirmDialogProps && <ConfirmDialog {...row.confirmDialogProps} />}

      {row.hasShareableLink && row.shareUrl && (
        <SurveyShareDialog
          open={row.shareDialogOpen}
          onOpenChange={row.setShareDialogOpen}
          shareUrl={row.shareUrl}
          surveyTitle={survey.title}
        />
      )}

      {row.canExport && (
        <ExportDialog
          open={row.exportDialogOpen}
          onOpenChange={row.setExportDialogOpen}
          surveyId={survey.id}
          surveyTitle={survey.title}
        />
      )}
    </>
  );
}
