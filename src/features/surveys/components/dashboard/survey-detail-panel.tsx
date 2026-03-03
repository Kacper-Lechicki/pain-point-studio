'use client';

import { useState } from 'react';

import { MoreHorizontal } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { DropdownMenu, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { SectionLabel } from '@/components/ui/metric-display';
import { Separator } from '@/components/ui/separator';
import type { UserSurvey } from '@/features/surveys/actions/get-user-surveys';
import { DetailPanelMetrics } from '@/features/surveys/components/dashboard/detail-panel-metrics';
import { DetailQuestionsList } from '@/features/surveys/components/dashboard/detail-questions-list';
import { Sparkline, getSparklineColor } from '@/features/surveys/components/dashboard/sparkline';
import { SurveyActionMenuContent } from '@/features/surveys/components/dashboard/survey-action-menu';
import { SurveyDetailInfo } from '@/features/surveys/components/dashboard/survey-detail-info';
import { SurveyShareDialog } from '@/features/surveys/components/dashboard/survey-share-dialog';
import { ExportDialog } from '@/features/surveys/components/stats/export-dialog';
import { DATE_FORMAT_SHORT } from '@/features/surveys/config';
import { deriveSurveyFlags, getAvailableActions } from '@/features/surveys/config/survey-status';
import { useSurveyAction, useSurveyCardActions } from '@/features/surveys/hooks';
import { calculateRespondentProgress } from '@/features/surveys/lib/calculations';
import type { MappedQuestion } from '@/features/surveys/lib/map-question-row';
import { cn } from '@/lib/common/utils';

type DetailPanelVariant = 'sheet' | 'sidebar';

interface SurveyDetailPanelProps {
  survey: UserSurvey;
  questions: MappedQuestion[] | null;
  now?: Date;
  onStatusChange: (surveyId: string, action: string) => void;
  variant?: DetailPanelVariant;
}

export function SurveyDetailPanel({
  survey,
  questions,
  onStatusChange,
  variant = 'sidebar',
}: SurveyDetailPanelProps) {
  const t = useTranslations();
  const format = useFormatter();
  const { handleActionClick, confirmDialogProps } = useSurveyAction(survey.id, onStatusChange, t);

  const { shareUrl, shareDialogOpen, setShareDialogOpen, handleShare } = useSurveyCardActions(
    survey.slug
  );

  const flags = deriveSurveyFlags(survey.status);
  const { isDraft, isActive, isArchived, isTrashed } = flags;
  const showActiveDetails = !isDraft && !isArchived;
  const hasShareableLink = (isActive || flags.isCompleted || flags.isCancelled) && !!shareUrl;
  const canExport = !isDraft && !isArchived;
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const sparklineColor = getSparklineColor(survey.recentActivity);

  const respondentProgress = calculateRespondentProgress(
    survey.completedCount,
    survey.maxRespondents
  );

  const availableActions = getAvailableActions(survey.status);
  const formatDate = (iso: string) => format.dateTime(new Date(iso), DATE_FORMAT_SHORT);

  const content = (
    <div className="flex min-w-0 flex-col">
      <div className="flex min-w-0 items-start justify-between gap-2">
        <h3 className="text-foreground min-w-0 flex-1 truncate text-base leading-snug font-semibold">
          {survey.title}
        </h3>

        {variant === 'sheet' && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-xs"
                className="text-muted-foreground shrink-0"
                aria-label={t('surveys.dashboard.actions.actions')}
              >
                <MoreHorizontal className="size-4" aria-hidden />
              </Button>
            </DropdownMenuTrigger>

            <SurveyActionMenuContent
              surveyId={survey.id}
              flags={{
                isDraft,
                isArchived,
                isTrashed,
                hasShareableLink,
                questionCount: survey.questionCount,
              }}
              availableActions={availableActions}
              onShare={handleShare}
              onExport={canExport ? () => setExportDialogOpen(true) : undefined}
              handleActionClick={handleActionClick}
            />
          </DropdownMenu>
        )}
      </div>

      {survey.description && (
        <p className="text-muted-foreground mt-2.5 line-clamp-3 text-xs leading-relaxed">
          {survey.description}
        </p>
      )}

      {isActive && (
        <>
          <Separator className="my-4" />
          <SectionLabel>{t('surveys.dashboard.detailPanel.last14Days')}</SectionLabel>
          <Sparkline data={survey.recentActivity} className={cn('h-10 w-full', sparklineColor)} />
        </>
      )}

      {showActiveDetails && (
        <>
          <Separator className="my-4" />

          <DetailPanelMetrics
            surveyId={survey.id}
            responseCount={survey.responseCount}
            completedCount={survey.completedCount}
            maxRespondents={survey.maxRespondents}
            respondentProgress={respondentProgress}
            avgQuestionCompletion={survey.avgQuestionCompletion}
            avgCompletionSeconds={survey.avgCompletionSeconds}
          />
        </>
      )}

      <Separator className="my-4" />

      <SurveyDetailInfo
        survey={survey}
        flags={flags}
        showActiveDetails={showActiveDetails}
        formatDate={formatDate}
      />

      {!(questions != null && questions.length === 0) && (
        <>
          <Separator className="my-4" />
          <DetailQuestionsList questions={questions} />
        </>
      )}
    </div>
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

  const exportDialogElement = canExport && (
    <ExportDialog
      open={exportDialogOpen}
      onOpenChange={setExportDialogOpen}
      surveyId={survey.id}
      surveyTitle={survey.title}
    />
  );

  const wrapperProps = { 'aria-label': survey.title };

  if (variant === 'sheet') {
    return (
      <div className="flex min-w-0 flex-col" {...wrapperProps}>
        {content}
        {confirmDialogElement}
        {shareDialogElement}
        {exportDialogElement}
      </div>
    );
  }

  return (
    <aside
      className="border-border/50 bg-card sticky top-6 flex min-w-0 flex-col rounded-lg border p-4 shadow-sm"
      {...wrapperProps}
    >
      {content}
      {confirmDialogElement}
      {shareDialogElement}
      {exportDialogElement}
    </aside>
  );
}
