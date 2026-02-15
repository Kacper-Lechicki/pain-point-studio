'use client';

import {
  BarChart3,
  Calendar,
  CalendarClock,
  CalendarX2,
  Clock,
  Expand,
  Hash,
  MessageSquare,
  Pencil,
  Percent,
  Send,
  Share2,
  Tag,
  Timer,
  Users,
} from 'lucide-react';
import { useFormatter, useNow, useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { ClipboardInput } from '@/components/ui/clipboard-input';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Separator } from '@/components/ui/separator';
import type { UserSurvey } from '@/features/surveys/actions/get-user-surveys';
import { DetailMetricsGrid } from '@/features/surveys/components/shared/detail-metrics-grid';
import { DetailQuestionsList } from '@/features/surveys/components/shared/detail-questions-list';
import { MetricRow, SectionLabel } from '@/features/surveys/components/shared/metric-display';
import { DATE_FORMAT_SHORT, QUESTIONS_MIN } from '@/features/surveys/config';
import { SURVEY_CATEGORIES } from '@/features/surveys/config/survey-categories';
import {
  SURVEY_ACTION_UI,
  SURVEY_STATUS_CONFIG,
  deriveSurveyFlags,
  getAvailableActions,
} from '@/features/surveys/config/survey-status';
import { useSurveyAction } from '@/features/surveys/hooks/use-survey-action';
import { useSurveyCardActions } from '@/features/surveys/hooks/use-survey-card-actions';
import {
  calculateCompletionRate,
  calculateRespondentProgress,
  daysUntilExpiry,
} from '@/features/surveys/lib/calculations';
import type { MappedQuestion } from '@/features/surveys/lib/map-question-row';
import {
  getSurveyDetailUrl,
  getSurveyEditUrl,
  getSurveyPublishUrl,
  getSurveyStatsUrl,
} from '@/features/surveys/lib/survey-urls';
import Link from '@/i18n/link';
import { cn } from '@/lib/common/utils';

import { Sparkline, getSparklineColor } from './sparkline';
import { SurveyStatusBadge } from './survey-status-badge';

// ── Component ───────────────────────────────────────────────────────

interface SurveyDetailPanelProps {
  survey: UserSurvey;
  questions: MappedQuestion[] | null;
  onStatusChange: (surveyId: string, action: string) => void;
  embeddedInSheet?: boolean;
  /** When true, renders as full-page content (main, no sticky). */
  embeddedInPage?: boolean;
}

export function SurveyDetailPanel({
  survey,
  questions,
  onStatusChange,
  embeddedInSheet = false,
  embeddedInPage = false,
}: SurveyDetailPanelProps) {
  const t = useTranslations();
  const format = useFormatter();
  const now = useNow();

  const { handleActionClick, confirmDialogProps } = useSurveyAction(survey.id, onStatusChange, t);
  const { shareUrl, handleShare } = useSurveyCardActions(survey.slug);

  const { isDraft, isActive, isClosed, isCancelled, isArchived } = deriveSurveyFlags(survey.status);
  const hasShareableLink = (isActive || isClosed) && !!shareUrl;
  const sparklineColor = getSparklineColor(survey.recentActivity);
  const completionRate = calculateCompletionRate(survey.completedCount, survey.responseCount);
  const lastResponseLabel =
    survey.lastResponseAt != null
      ? format.relativeTime(new Date(survey.lastResponseAt), now)
      : null;
  const respondentProgress = calculateRespondentProgress(
    survey.completedCount,
    survey.maxRespondents
  );
  const availableActions = getAvailableActions(survey.status);
  const canPublish = isDraft && survey.questionCount >= QUESTIONS_MIN;

  const formatDate = (iso: string) => format.dateTime(new Date(iso), DATE_FORMAT_SHORT);

  const titleHeadingClass = embeddedInPage
    ? 'text-foreground min-w-0 flex-1 truncate text-3xl font-bold leading-tight'
    : 'text-foreground min-w-0 flex-1 truncate text-base leading-snug font-semibold';

  const content = (
    <div className="flex min-w-0 flex-col">
      <div className="flex min-w-0 items-start justify-between gap-2">
        {embeddedInPage ? (
          <h1 className={titleHeadingClass}>{survey.title}</h1>
        ) : (
          <h3 className={titleHeadingClass}>{survey.title}</h3>
        )}
        {embeddedInSheet && (
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

      {/* Description */}
      {survey.description && (
        <p className="text-muted-foreground mt-2.5 line-clamp-3 text-xs leading-relaxed">
          {survey.description}
        </p>
      )}

      <Separator className="my-4" />

      {/* Key Metrics */}
      <DetailMetricsGrid
        questionCount={survey.questionCount}
        completedCount={survey.completedCount}
        maxRespondents={survey.maxRespondents}
        completionRate={completionRate}
        lastResponseLabel={lastResponseLabel}
        respondentProgress={respondentProgress}
        isDraft={isDraft}
        isArchived={isArchived}
      />

      {!isArchived && !isDraft && !isClosed && (
        <>
          <Separator className="my-4" />
          <SectionLabel>{t('surveys.dashboard.detailPanel.last14Days')}</SectionLabel>
          <Sparkline data={survey.recentActivity} className={cn('h-10 w-full', sparklineColor)} />
        </>
      )}

      <Separator className="my-4" />

      {/* Details Section */}
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
        {!isDraft && !isArchived && (
          <MetricRow
            icon={Hash}
            label={t('surveys.dashboard.detailPanel.responses')}
            value={
              survey.maxRespondents != null
                ? `${survey.completedCount} / ${survey.maxRespondents}`
                : survey.completedCount
            }
          />
        )}
        {!isDraft && !isArchived && completionRate != null && (
          <MetricRow
            icon={Percent}
            label={t('surveys.dashboard.detailPanel.completionRate')}
            value={`${completionRate}%`}
          />
        )}
        {!isDraft && !isArchived && (
          <MetricRow
            icon={MessageSquare}
            label={t('surveys.dashboard.detailPanel.lastResponse')}
            value={lastResponseLabel ?? '—'}
          />
        )}
        {!isDraft && survey.startsAt && (
          <MetricRow
            icon={CalendarClock}
            label={t('surveys.dashboard.detailPanel.startsAt')}
            value={formatDate(survey.startsAt)}
          />
        )}
        {!isDraft && survey.endsAt && (
          <MetricRow
            icon={CalendarX2}
            label={t('surveys.dashboard.detailPanel.endsAt')}
            value={formatDate(survey.endsAt)}
          />
        )}
        {!isDraft && survey.maxRespondents != null && (
          <MetricRow
            icon={Users}
            label={t('surveys.dashboard.detailPanel.respondentCap')}
            value={survey.maxRespondents}
          />
        )}
        {isArchived &&
          (() => {
            const days = daysUntilExpiry(survey.archivedAt, 30);

            return days != null ? (
              <MetricRow
                icon={Timer}
                label={t('surveys.dashboard.detailPanel.autoDeletes')}
                value={t('surveys.dashboard.detailPanel.inDays', { days })}
              />
            ) : null;
          })()}
        {isCancelled &&
          (() => {
            const days = daysUntilExpiry(survey.cancelledAt, 30);

            return days != null ? (
              <MetricRow
                icon={Timer}
                label={t('surveys.dashboard.detailPanel.linkExpires')}
                value={t('surveys.dashboard.detailPanel.inDays', { days })}
              />
            ) : null;
          })()}
      </div>

      {/* Share URL (active, closed) */}
      {hasShareableLink && shareUrl && (
        <>
          <Separator className="my-4" />
          <SectionLabel>{t('surveys.dashboard.detailPanel.surveyLink')}</SectionLabel>
          <ClipboardInput
            value={shareUrl}
            className="max-w-full"
            copyLabel={t('surveys.dashboard.detailPanel.copyLink')}
            copiedLabel={t('surveys.dashboard.detailPanel.linkCopied')}
          />
        </>
      )}

      <Separator className="my-4" />

      {/* Actions */}
      <SectionLabel>{t('surveys.dashboard.detailPanel.actionsLabel')}</SectionLabel>
      <div className="flex flex-col gap-2">
        {isDraft && (
          <>
            {canPublish && (
              <Button size="sm" className="w-full" asChild>
                <Link href={getSurveyPublishUrl(survey.id)}>
                  <Send className="size-4" aria-hidden />
                  {t('surveys.builder.publish')}
                </Link>
              </Button>
            )}
            <Button variant="outline" size="sm" className="w-full" asChild>
              <Link href={getSurveyEditUrl(survey.id)}>
                <Pencil className="size-4" aria-hidden />
                {t('surveys.dashboard.actions.edit')}
              </Link>
            </Button>
          </>
        )}
        {!isDraft && !isArchived && (
          <Button asChild size="sm" className="w-full">
            <Link href={getSurveyStatsUrl(survey.id)}>
              <BarChart3 className="size-4" aria-hidden />
              {t('surveys.dashboard.detailPanel.viewResults')}
            </Link>
          </Button>
        )}
        {hasShareableLink && (
          <Button variant="outline" size="sm" className="w-full" onClick={handleShare}>
            <Share2 className="size-4" aria-hidden />
            {t('surveys.dashboard.actions.share')}
          </Button>
        )}
      </div>

      {/* Status transition buttons */}
      {availableActions.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {availableActions.map((action) => {
            const ui = SURVEY_ACTION_UI[action];
            const Icon = ui.icon;

            return (
              <Button
                key={action}
                variant="outline"
                size="sm"
                className={cn(
                  'h-7 gap-1 px-2 text-xs hover:bg-transparent md:hover:bg-transparent',
                  ui.buttonColor === 'destructive' &&
                    'text-destructive hover:text-destructive md:hover:text-destructive border-destructive/30 hover:border-destructive/40',
                  ui.buttonColor === 'warning' &&
                    'border-amber-500/30 text-amber-600 hover:border-amber-500/40 hover:text-amber-600 md:hover:text-amber-600 dark:text-amber-500 dark:hover:text-amber-500 dark:md:hover:text-amber-500',
                  ui.buttonColor === 'accent' &&
                    'border-violet-500/30 text-violet-600 hover:border-violet-500/40 hover:text-violet-600 md:hover:text-violet-600 dark:text-violet-400 dark:hover:text-violet-400 dark:md:hover:text-violet-400'
                )}
                onClick={() => handleActionClick(action)}
              >
                <Icon className="size-3.5" aria-hidden />
                {t(`surveys.dashboard.actions.${action}`)}
              </Button>
            );
          })}
        </div>
      )}

      {/* Questions */}
      {!(questions != null && questions.length === 0) && (
        <>
          <Separator className="my-4" />
          <DetailQuestionsList questions={questions} />
        </>
      )}
    </div>
  );

  const confirmDialogElement = confirmDialogProps && <ConfirmDialog {...confirmDialogProps} />;

  if (embeddedInSheet) {
    return (
      <div className="flex min-w-0 flex-col" aria-label={survey.title}>
        {content}
        {confirmDialogElement}
      </div>
    );
  }

  if (embeddedInPage) {
    return (
      <main className="flex min-w-0 flex-col" aria-label={survey.title}>
        {content}
        {confirmDialogElement}
      </main>
    );
  }

  return (
    <aside
      className="border-border/50 bg-card sticky top-6 flex min-w-0 flex-col rounded-lg border p-4 shadow-sm"
      aria-label={survey.title}
    >
      {content}
      {confirmDialogElement}
    </aside>
  );
}
