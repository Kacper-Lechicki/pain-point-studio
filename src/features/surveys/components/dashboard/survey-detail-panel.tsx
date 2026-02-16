'use client';

import {
  Archive,
  Calendar,
  CalendarClock,
  CalendarX2,
  Clock,
  Expand,
  Tag,
  Users,
} from 'lucide-react';
import { useFormatter, useNow, useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Separator } from '@/components/ui/separator';
import type { UserSurvey } from '@/features/surveys/actions/get-user-surveys';
import { DetailQuestionsList } from '@/features/surveys/components/shared/detail-questions-list';
import { ExpiryMetricRow } from '@/features/surveys/components/shared/expiry-metric-row';
import { MetricRow, SectionLabel } from '@/features/surveys/components/shared/metric-display';
import { DATE_FORMAT_SHORT, NOW_UPDATE_INTERVAL_MS } from '@/features/surveys/config';
import { SURVEY_CATEGORIES } from '@/features/surveys/config/survey-categories';
import {
  SURVEY_STATUS_CONFIG,
  deriveSurveyFlags,
  getAvailableActions,
} from '@/features/surveys/config/survey-status';
import { useSurveyAction } from '@/features/surveys/hooks/use-survey-action';
import { useSurveyCardActions } from '@/features/surveys/hooks/use-survey-card-actions';
import {
  calculateRespondentProgress,
  formatCompletionTime,
} from '@/features/surveys/lib/calculations';
import type { MappedQuestion } from '@/features/surveys/lib/map-question-row';
import { getSurveyDetailUrl } from '@/features/surveys/lib/survey-urls';
import Link from '@/i18n/link';
import { cn } from '@/lib/common/utils';

import { DetailPanelActions } from './detail-panel-actions';
import { DetailPanelMetrics } from './detail-panel-metrics';
import { Sparkline, getSparklineColor } from './sparkline';
import { SurveyShareDialog } from './survey-share-dialog';
import { SurveyStatusBadge } from './survey-status-badge';

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
  now: externalNow,
  onStatusChange,
  variant = 'sidebar',
}: SurveyDetailPanelProps) {
  const t = useTranslations();
  const format = useFormatter();
  const localNow = useNow({ updateInterval: NOW_UPDATE_INTERVAL_MS });
  const now = externalNow ?? localNow;

  const { handleActionClick, confirmDialogProps } = useSurveyAction(survey.id, onStatusChange, t);
  const { shareUrl, shareDialogOpen, setShareDialogOpen, handleShare } = useSurveyCardActions(
    survey.slug
  );

  const flags = deriveSurveyFlags(survey.status);
  const { isDraft, isActive, isCompleted, isCancelled, isArchived } = flags;
  const showActiveDetails = !isDraft && !isArchived;
  const hasShareableLink = (isActive || isCompleted || isCancelled) && !!shareUrl;
  const sparklineColor = getSparklineColor(survey.recentActivity);
  const lastResponseLabel =
    survey.lastResponseAt != null
      ? format.relativeTime(new Date(survey.lastResponseAt), now)
      : null;
  const respondentProgress = calculateRespondentProgress(
    survey.completedCount,
    survey.maxRespondents
  );
  const completionTimeLabel = formatCompletionTime(survey.avgCompletionSeconds);
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
            responseCount={survey.responseCount}
            completedCount={survey.completedCount}
            maxRespondents={survey.maxRespondents}
            respondentProgress={respondentProgress}
            lastResponseLabel={lastResponseLabel}
            completionTimeLabel={completionTimeLabel}
          />
        </>
      )}

      <Separator className="my-4" />

      <SectionLabel>{t('surveys.dashboard.detailPanel.detailsLabel')}</SectionLabel>
      <div className="space-y-2">
        <MetricRow
          icon={SURVEY_STATUS_CONFIG[survey.status].icon}
          label={t('surveys.dashboard.detailPanel.status')}
          value={<SurveyStatusBadge status={survey.status} />}
        />
        {survey.category &&
          (() => {
            const cat = SURVEY_CATEGORIES.find((c) => c.value === survey.category);

            return cat ? (
              <MetricRow
                icon={Tag}
                label={t('surveys.dashboard.detailPanel.category')}
                value={t(cat.labelKey as Parameters<typeof t>[0])}
              />
            ) : null;
          })()}

        {showActiveDetails && survey.startsAt && (
          <MetricRow
            icon={CalendarClock}
            label={t('surveys.dashboard.detailPanel.startsAt')}
            value={formatDate(survey.startsAt)}
          />
        )}
        {showActiveDetails && survey.endsAt && (
          <MetricRow
            icon={CalendarX2}
            label={t('surveys.dashboard.detailPanel.endsAt')}
            value={formatDate(survey.endsAt)}
          />
        )}
        {showActiveDetails && survey.maxRespondents != null && (
          <MetricRow
            icon={Users}
            label={t('surveys.dashboard.detailPanel.respondentCap')}
            value={survey.maxRespondents}
          />
        )}

        {isCompleted && (
          <ExpiryMetricRow
            timestampAt={survey.completedAt}
            labelKey="surveys.dashboard.detailPanel.linkExpires"
          />
        )}
        {isCancelled && (
          <ExpiryMetricRow
            timestampAt={survey.cancelledAt}
            labelKey="surveys.dashboard.detailPanel.linkExpires"
          />
        )}
        {isArchived && survey.archivedAt && (
          <MetricRow
            icon={Archive}
            label={t('surveys.dashboard.detailPanel.archivedAt')}
            value={formatDate(survey.archivedAt)}
          />
        )}
        {isArchived && (
          <ExpiryMetricRow
            timestampAt={survey.archivedAt}
            labelKey="surveys.dashboard.detailPanel.autoDeletes"
          />
        )}

        <MetricRow
          icon={Calendar}
          label={t('surveys.dashboard.detailPanel.created')}
          value={formatDate(survey.createdAt)}
        />
        <MetricRow
          icon={Clock}
          label={t('surveys.dashboard.detailPanel.updated')}
          value={formatDate(survey.updatedAt)}
        />
      </div>

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
