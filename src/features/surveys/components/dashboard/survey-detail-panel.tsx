'use client';

import {
  Archive,
  BarChart3,
  Calendar,
  CalendarClock,
  CalendarX2,
  Clock,
  Expand,
  MousePointerClick,
  Pencil,
  Send,
  Share2,
  Tag,
  Timer,
  Users,
} from 'lucide-react';
import { useFormatter, useNow, useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Separator } from '@/components/ui/separator';
import type { UserSurvey } from '@/features/surveys/actions/get-user-surveys';
import { DetailQuestionsList } from '@/features/surveys/components/shared/detail-questions-list';
import { MetricRow, SectionLabel } from '@/features/surveys/components/shared/metric-display';
import { DATE_FORMAT_SHORT, QUESTIONS_MIN, SURVEY_RETENTION_DAYS } from '@/features/surveys/config';
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
  calculateRespondentProgress,
  daysUntilExpiry,
  formatCompletionTime,
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
import { SurveyShareDialog } from './survey-share-dialog';
import { SurveyStatusBadge } from './survey-status-badge';

// ── Component ───────────────────────────────────────────────────────

interface SurveyDetailPanelProps {
  survey: UserSurvey;
  questions: MappedQuestion[] | null;
  /** Shared clock from the parent — keeps relative times consistent with sibling components.
   *  Falls back to a local `useNow()` when rendered standalone (e.g. full-page detail). */
  now?: Date;
  onStatusChange: (surveyId: string, action: string) => void;
  embeddedInSheet?: boolean;
  /** When true, renders as full-page content (main, no sticky). */
  embeddedInPage?: boolean;
}

export function SurveyDetailPanel({
  survey,
  questions,
  now: externalNow,
  onStatusChange,
  embeddedInSheet = false,
  embeddedInPage = false,
}: SurveyDetailPanelProps) {
  const t = useTranslations();
  const format = useFormatter();
  const localNow = useNow({ updateInterval: 60_000 });
  const now = externalNow ?? localNow;

  const { handleActionClick, confirmDialogProps } = useSurveyAction(survey.id, onStatusChange, t);
  const { shareUrl, shareDialogOpen, setShareDialogOpen, handleShare } = useSurveyCardActions(
    survey.slug
  );

  const { isDraft, isActive, isCompleted, isCancelled, isArchived } = deriveSurveyFlags(
    survey.status
  );
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

      {isActive && (
        <>
          <Separator className="my-4" />
          <SectionLabel>{t('surveys.dashboard.detailPanel.last14Days')}</SectionLabel>
          <Sparkline data={survey.recentActivity} className={cn('h-10 w-full', sparklineColor)} />
        </>
      )}

      {!isDraft && !isArchived && (
        <>
          <Separator className="my-4" />

          {/* Key Metrics (compact — 4 metrics + link to full stats) */}
          <SectionLabel>{t('surveys.dashboard.detailPanel.metricsLabel')}</SectionLabel>
          <div className="grid grid-cols-2 gap-2">
            <div className="border-border/50 rounded-md border px-3 py-2.5">
              <div className="text-foreground text-lg leading-none font-semibold tabular-nums">
                {survey.responseCount}
              </div>
              <div className="text-muted-foreground mt-1.5 flex items-start gap-1 text-[11px]">
                <MousePointerClick className="mt-0.5 size-3 shrink-0" aria-hidden />
                {t('surveys.dashboard.detailPanel.visitors')}
              </div>
            </div>
            <div className="border-border/50 rounded-md border px-3 py-2.5">
              <div className="text-foreground text-lg leading-none font-semibold tabular-nums">
                {survey.completedCount}
                {survey.maxRespondents != null && (
                  <span className="text-muted-foreground text-xs font-normal">
                    {' '}
                    / {survey.maxRespondents}
                  </span>
                )}
              </div>
              <div className="text-muted-foreground mt-1.5 flex items-start gap-1 text-[11px]">
                <Users className="mt-0.5 size-3 shrink-0" aria-hidden />
                {t('surveys.dashboard.detailPanel.responses')}
              </div>
              {respondentProgress != null && (
                <div className="bg-muted mt-2 h-1 w-full overflow-hidden rounded-full">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all"
                    style={{ width: `${respondentProgress}%` }}
                  />
                </div>
              )}
            </div>
            <div className="border-border/50 rounded-md border px-3 py-2.5">
              <div className="text-foreground text-sm leading-none font-semibold">
                {lastResponseLabel ?? '—'}
              </div>
              <div className="text-muted-foreground mt-1.5 text-[11px]">
                {t('surveys.dashboard.detailPanel.lastResponse')}
              </div>
            </div>
            <div className="border-border/50 rounded-md border px-3 py-2.5">
              <div className="text-foreground text-lg leading-none font-semibold tabular-nums">
                {completionTimeLabel ?? '—'}
              </div>
              <div className="text-muted-foreground mt-1.5 flex items-start gap-1 text-[11px]">
                <Timer className="mt-0.5 size-3 shrink-0" aria-hidden />
                {t('surveys.dashboard.detailPanel.avgCompletionTime')}
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground mt-2.5 h-7 w-full text-xs"
            asChild
          >
            <Link href={getSurveyStatsUrl(survey.id)}>
              <BarChart3 className="size-3.5" aria-hidden />
              {t('surveys.dashboard.detailPanel.viewAllMetrics')}
            </Link>
          </Button>
        </>
      )}

      <Separator className="my-4" />

      {/* Details Section */}
      <SectionLabel>{t('surveys.dashboard.detailPanel.detailsLabel')}</SectionLabel>
      <div className="space-y-2">
        {/* ── Identity ──────────────────────────────────────────── */}
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

        {/* ── Scheduling & limits (not relevant for drafts / archived) ── */}
        {!isDraft && !isArchived && survey.startsAt && (
          <MetricRow
            icon={CalendarClock}
            label={t('surveys.dashboard.detailPanel.startsAt')}
            value={formatDate(survey.startsAt)}
          />
        )}
        {!isDraft && !isArchived && survey.endsAt && (
          <MetricRow
            icon={CalendarX2}
            label={t('surveys.dashboard.detailPanel.endsAt')}
            value={formatDate(survey.endsAt)}
          />
        )}
        {!isDraft && !isArchived && survey.maxRespondents != null && (
          <MetricRow
            icon={Users}
            label={t('surveys.dashboard.detailPanel.respondentCap')}
            value={survey.maxRespondents}
          />
        )}

        {/* ── Retention & expiry ────────────────────────────────── */}
        {isCompleted &&
          (() => {
            const days = daysUntilExpiry(survey.completedAt, SURVEY_RETENTION_DAYS);

            return days != null ? (
              <MetricRow
                icon={Timer}
                label={t('surveys.dashboard.detailPanel.linkExpires')}
                value={t('surveys.dashboard.detailPanel.inDays', { days })}
              />
            ) : null;
          })()}
        {isCancelled &&
          (() => {
            const days = daysUntilExpiry(survey.cancelledAt, SURVEY_RETENTION_DAYS);

            return days != null ? (
              <MetricRow
                icon={Timer}
                label={t('surveys.dashboard.detailPanel.linkExpires')}
                value={t('surveys.dashboard.detailPanel.inDays', { days })}
              />
            ) : null;
          })()}
        {isArchived && survey.archivedAt && (
          <MetricRow
            icon={Archive}
            label={t('surveys.dashboard.detailPanel.archivedAt')}
            value={formatDate(survey.archivedAt)}
          />
        )}
        {isArchived &&
          (() => {
            const days = daysUntilExpiry(survey.archivedAt, SURVEY_RETENTION_DAYS);

            return days != null ? (
              <MetricRow
                icon={Timer}
                label={t('surveys.dashboard.detailPanel.autoDeletes')}
                value={t('surveys.dashboard.detailPanel.inDays', { days })}
              />
            ) : null;
          })()}

        {/* ── Metadata (always last) ────────────────────────────── */}
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
  const shareDialogElement = hasShareableLink && shareUrl && (
    <SurveyShareDialog
      open={shareDialogOpen}
      onOpenChange={setShareDialogOpen}
      shareUrl={shareUrl}
      surveyTitle={survey.title}
    />
  );

  if (embeddedInSheet) {
    return (
      <div className="flex min-w-0 flex-col" aria-label={survey.title}>
        {content}
        {confirmDialogElement}
        {shareDialogElement}
      </div>
    );
  }

  if (embeddedInPage) {
    return (
      <main className="flex min-w-0 flex-col" aria-label={survey.title}>
        {content}
        {confirmDialogElement}
        {shareDialogElement}
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
      {shareDialogElement}
    </aside>
  );
}
