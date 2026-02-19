'use client';

import { Expand } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Separator } from '@/components/ui/separator';
import type { UserSurvey } from '@/features/surveys/actions/get-user-surveys';
import { DetailPanelActions } from '@/features/surveys/components/dashboard/detail-panel-actions';
import { DetailPanelMetrics } from '@/features/surveys/components/dashboard/detail-panel-metrics';
import { DetailQuestionsList } from '@/features/surveys/components/dashboard/detail-questions-list';
import { Sparkline, getSparklineColor } from '@/features/surveys/components/dashboard/sparkline';
import { SurveyDetailInfo } from '@/features/surveys/components/dashboard/survey-detail-info';
import { SurveyShareDialog } from '@/features/surveys/components/dashboard/survey-share-dialog';
import { SectionLabel } from '@/features/surveys/components/shared/metric-display';
import { DATE_FORMAT_SHORT } from '@/features/surveys/config';
import { deriveSurveyFlags, getAvailableActions } from '@/features/surveys/config/survey-status';
import { useSurveyAction, useSurveyCardActions } from '@/features/surveys/hooks';
import { calculateRespondentProgress } from '@/features/surveys/lib/calculations';
import type { MappedQuestion } from '@/features/surveys/lib/map-question-row';
import { getSurveyDetailUrl } from '@/features/surveys/lib/survey-urls';
import Link from '@/i18n/link';
import { cn } from '@/lib/common/utils';

type DetailPanelVariant = 'sheet' | 'page' | 'sidebar';

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
  const { isDraft, isActive, isCompleted, isCancelled, isArchived } = flags;
  const showActiveDetails = !isDraft && !isArchived;
  const hasShareableLink = (isActive || isCompleted || isCancelled) && !!shareUrl;
  const sparklineColor = getSparklineColor(survey.recentActivity);
  const respondentProgress = calculateRespondentProgress(
    survey.completedCount,
    survey.maxRespondents
  );
  const availableActions = getAvailableActions(survey.status);

  const formatDate = (iso: string) => format.dateTime(new Date(iso), DATE_FORMAT_SHORT);

  const titleHeadingClass =
    variant === 'page'
      ? 'text-foreground min-w-0 flex-1 truncate text-3xl font-bold leading-tight'
      : 'text-foreground min-w-0 flex-1 truncate text-base leading-snug font-semibold';

  const content = (
    <div className="flex min-w-0 flex-col">
      <div className="flex min-w-0 items-start justify-between gap-2">
        {variant === 'page' ? (
          <h1 className={titleHeadingClass}>{survey.title}</h1>
        ) : (
          <h3 className={titleHeadingClass}>{survey.title}</h3>
        )}
        {variant === 'sheet' && (
          <Button
            variant="ghost"
            size="icon-xs"
            className="text-muted-foreground shrink-0"
            aria-label={t('surveys.dashboard.actions.openInFullPage')}
            asChild
          >
            <Link href={getSurveyDetailUrl(survey.id)}>
              <Expand className="size-4" aria-hidden />
            </Link>
          </Button>
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
            viewCount={survey.viewCount}
            responseCount={survey.responseCount}
            completedCount={survey.completedCount}
            maxRespondents={survey.maxRespondents}
            respondentProgress={respondentProgress}
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

      <Separator className="my-4" />

      <DetailPanelActions
        surveyId={survey.id}
        questionCount={survey.questionCount}
        flags={flags}
        hasShareableLink={hasShareableLink}
        availableActions={availableActions}
        onShare={handleShare}
        onActionClick={handleActionClick}
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

  const wrapperProps = { 'aria-label': survey.title };

  if (variant === 'sheet') {
    return (
      <div className="flex min-w-0 flex-col" {...wrapperProps}>
        {content}
        {confirmDialogElement}
        {shareDialogElement}
      </div>
    );
  }

  if (variant === 'page') {
    return (
      <main className="flex min-w-0 flex-col" {...wrapperProps}>
        {content}
        {confirmDialogElement}
        {shareDialogElement}
      </main>
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
    </aside>
  );
}
