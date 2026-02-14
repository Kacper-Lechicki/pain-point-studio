'use client';

import type { ReactNode } from 'react';

import { useRouter } from 'next/navigation';

import {
  BarChart3,
  Calendar,
  Copy,
  Expand,
  Hash,
  HelpCircle,
  Loader2,
  Pencil,
  Share2,
  Tag,
  Users,
} from 'lucide-react';
import { useFormatter, useLocale, useNow, useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { ClipboardInput } from '@/components/ui/clipboard-input';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Separator } from '@/components/ui/separator';
import { duplicateSurvey } from '@/features/surveys/actions';
import type { UserSurvey } from '@/features/surveys/actions/get-user-surveys';
import {
  DATE_FORMAT_SHORT,
  QUESTION_TYPE_ICONS,
  QUESTION_TYPE_LABEL_KEYS,
} from '@/features/surveys/config';
import { SURVEY_ACTION_UI, getAvailableActions } from '@/features/surveys/config/survey-status';
import { useSurveyAction } from '@/features/surveys/hooks/use-survey-action';
import {
  calculateCompletionRate,
  calculateRespondentProgress,
  daysUntilExpiry,
} from '@/features/surveys/lib/calculations';
import type { MappedQuestion } from '@/features/surveys/lib/map-question-row';
import { getSurveyShareUrl } from '@/features/surveys/lib/share-url';
import {
  getSurveyDetailUrl,
  getSurveyEditUrl,
  getSurveyStatsUrl,
} from '@/features/surveys/lib/survey-urls';
import Link from '@/i18n/link';
import { cn } from '@/lib/common/utils';

import { MetricRow, SectionLabel } from '../shared/metric-display';
import { Sparkline, getSparklineColor } from './sparkline';
import { SurveyStatusBadge } from './survey-status-badge';

// ── Local layout components ─────────────────────────────────────────

function QuestionConfigDetails({
  question,
  t,
}: {
  question: MappedQuestion;
  t: ReturnType<typeof useTranslations<'surveys.dashboard'>>;
}) {
  const config = question.config;
  const rows: ReactNode[] = [];

  if (question.description?.trim()) {
    rows.push(
      <p key="desc">
        <span className="font-medium">{t('detailPanel.descriptionLabel')}:</span>{' '}
        {question.description.trim()}
      </p>
    );
  }

  if (question.type === 'open_text' || question.type === 'short_text') {
    const placeholder = (config.placeholder as string | undefined)?.trim();
    const maxLength = config.maxLength as number | undefined;

    if (placeholder) {
      rows.push(
        <p key="placeholder">
          <span className="font-medium">{t('detailPanel.placeholderLabel')}:</span> {placeholder}
        </p>
      );
    }

    if (maxLength != null && maxLength > 0) {
      rows.push(
        <p key="maxLength">
          <span className="font-medium">{t('detailPanel.maxLengthLabel')}:</span> {maxLength}
        </p>
      );
    }
  }

  if (question.type === 'multiple_choice') {
    const options = (config.options as string[] | undefined) ?? [];
    rows.push(
      <p key="options">
        <span className="font-medium">{t('detailPanel.optionsLabel')}:</span>{' '}
        {t('detailPanel.optionsCount', { count: options.length })}
      </p>
    );

    if (config.allowOther) {
      rows.push(<p key="other">{t('detailPanel.allowOther')}</p>);
    }

    const minSel = config.minSelections as number | undefined;
    const maxSel = config.maxSelections as number | undefined;

    if (minSel != null && minSel > 0) {
      rows.push(
        <p key="minSel">
          <span className="font-medium">{t('detailPanel.minSelectionsLabel')}:</span> {minSel}
        </p>
      );
    }

    if (maxSel != null && maxSel > 0) {
      rows.push(
        <p key="maxSel">
          <span className="font-medium">{t('detailPanel.maxSelectionsLabel')}:</span> {maxSel}
        </p>
      );
    }
  }

  if (question.type === 'rating_scale') {
    const min = (config.min as number | undefined) ?? 1;
    const max = (config.max as number | undefined) ?? 5;
    const minLabel = (config.minLabel as string | undefined)?.trim();
    const maxLabel = (config.maxLabel as string | undefined)?.trim();
    rows.push(
      <p key="scale">
        <span className="font-medium">{t('detailPanel.scaleLabel')}:</span>{' '}
        {t('detailPanel.scale', { min, max })}
      </p>
    );

    if (minLabel) {
      rows.push(
        <p key="minLabel">
          <span className="font-medium">{t('detailPanel.minLabelLabel')}:</span> {minLabel}
        </p>
      );
    }

    if (maxLabel) {
      rows.push(
        <p key="maxLabel">
          <span className="font-medium">{t('detailPanel.maxLabelLabel')}:</span> {maxLabel}
        </p>
      );
    }
  }

  if (rows.length === 0) {
    return null;
  }

  return <div className="text-muted-foreground mt-1.5 space-y-0.5 text-[10px]">{rows}</div>;
}

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
  const t = useTranslations('surveys.dashboard');
  const tCat = useTranslations('surveys.categories');
  const tTypes = useTranslations('surveys.builder.types');
  const locale = useLocale();
  const format = useFormatter();
  const now = useNow();
  const router = useRouter();

  const { handleActionClick, confirmDialogProps } = useSurveyAction(survey.id, onStatusChange, t);

  const isDraft = survey.status === 'draft';
  const isPending = survey.status === 'pending';
  const isActive = survey.status === 'active';
  const isClosed = survey.status === 'closed';
  const isArchived = survey.status === 'archived';
  const shareUrl = survey.slug ? getSurveyShareUrl(locale, survey.slug) : null;
  const hasShareableLink = (isActive || isPending || isClosed) && shareUrl;
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

  const handleCopyLink = async () => {
    if (!shareUrl) {
      return;
    }

    await navigator.clipboard.writeText(shareUrl);
    toast.success(t('detailPanel.linkCopied'));
  };

  const handleDuplicate = async () => {
    const result = await duplicateSurvey({ surveyId: survey.id });

    if (result.success && result.data) {
      toast.success(t('toast.duplicated'));
      router.push(getSurveyEditUrl(result.data.surveyId));
    }
  };

  const canDuplicate = isDraft || isActive || isClosed || survey.status === 'cancelled';

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
            aria-label={t('actions.openInFullPage')}
            asChild
          >
            <Link href={getSurveyDetailUrl(survey.id)}>
              <Expand className="size-4" aria-hidden />
            </Link>
          </Button>
        )}
      </div>

      {/* Status + Category */}
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <SurveyStatusBadge status={survey.status} />
        {survey.category && (
          <span className="bg-border/40 text-muted-foreground inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-normal">
            {tCat(survey.category as Parameters<typeof tCat>[0])}
          </span>
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
      <SectionLabel>{t('detailPanel.metricsLabel')}</SectionLabel>
      <div className="grid grid-cols-2 gap-2">
        <div className="border-border/50 rounded-md border px-3 py-2.5">
          <div className="text-foreground text-lg leading-none font-semibold tabular-nums">
            {survey.questionCount}
          </div>
          <div className="text-muted-foreground mt-1.5 flex items-center gap-1 text-[11px]">
            <Hash className="size-3" aria-hidden />
            {t('detailPanel.questions')}
          </div>
        </div>
        {!isDraft && (
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
            <div className="text-muted-foreground mt-1.5 flex items-center gap-1 text-[11px]">
              <Users className="size-3" aria-hidden />
              {t('detailPanel.responses')}
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
        )}
        {!isArchived && !isDraft && completionRate != null && (
          <div className="border-border/50 rounded-md border px-3 py-2.5">
            <div className="text-foreground text-lg leading-none font-semibold tabular-nums">
              {completionRate}%
            </div>
            <div className="text-muted-foreground mt-1.5 text-[11px]">
              {t('detailPanel.completionRate')}
            </div>
          </div>
        )}
        {!isArchived && !isDraft && lastResponseLabel != null && (
          <div className="border-border/50 rounded-md border px-3 py-2.5">
            <div className="text-foreground text-sm leading-none font-semibold">
              {lastResponseLabel}
            </div>
            <div className="text-muted-foreground mt-1.5 text-[11px]">
              {t('detailPanel.lastResponse')}
            </div>
          </div>
        )}
      </div>

      {!isArchived && !isDraft && (
        <>
          <Separator className="my-4" />
          <SectionLabel>{t('detailPanel.last14Days')}</SectionLabel>
          <Sparkline data={survey.recentActivity} className={cn('h-10 w-full', sparklineColor)} />
        </>
      )}

      <Separator className="my-4" />

      {/* Details Section */}
      <SectionLabel>{t('detailPanel.detailsLabel')}</SectionLabel>
      <div className="space-y-2">
        {survey.category && (
          <MetricRow
            icon={Tag}
            label={t('detailPanel.category')}
            value={tCat(survey.category as Parameters<typeof tCat>[0])}
          />
        )}
        <MetricRow
          icon={Calendar}
          label={t('detailPanel.created')}
          value={formatDate(survey.createdAt)}
        />
        <MetricRow label={t('detailPanel.updated')} value={formatDate(survey.updatedAt)} />
        {survey.startsAt && (
          <MetricRow label={t('detailPanel.startsAt')} value={formatDate(survey.startsAt)} />
        )}
        {survey.endsAt && (
          <MetricRow label={t('detailPanel.endsAt')} value={formatDate(survey.endsAt)} />
        )}
        {survey.maxRespondents != null && (
          <MetricRow label={t('detailPanel.respondentCap')} value={survey.maxRespondents} />
        )}
        {isArchived &&
          (() => {
            const days = daysUntilExpiry(survey.archivedAt, 30);

            return days != null ? (
              <MetricRow
                label={t('detailPanel.autoDeletes')}
                value={t('detailPanel.inDays', { days })}
              />
            ) : null;
          })()}
        {survey.status === 'cancelled' &&
          (() => {
            const days = daysUntilExpiry(survey.cancelledAt, 30);

            return days != null ? (
              <MetricRow
                label={t('detailPanel.linkExpires')}
                value={t('detailPanel.inDays', { days })}
              />
            ) : null;
          })()}
      </div>

      {/* Share URL (active, pending, closed) */}
      {hasShareableLink && (
        <>
          <Separator className="my-4" />
          <SectionLabel>{t('detailPanel.surveyLink')}</SectionLabel>
          <ClipboardInput
            value={shareUrl}
            className="max-w-full"
            copyLabel={t('detailPanel.copyLink')}
            copiedLabel={t('detailPanel.linkCopied')}
          />
        </>
      )}

      <Separator className="my-4" />

      {/* Actions */}
      <SectionLabel>{t('detailPanel.actionsLabel')}</SectionLabel>
      <div className="flex flex-col gap-2">
        {isDraft || isPending ? (
          <Button asChild size="sm" className="w-full">
            <Link href={getSurveyEditUrl(survey.id)}>
              <Pencil className="size-4" aria-hidden />
              {t('actions.edit')}
            </Link>
          </Button>
        ) : (
          <Button asChild size="sm" className="w-full">
            <Link href={getSurveyStatsUrl(survey.id)}>
              <BarChart3 className="size-4" aria-hidden />
              {t('detailPanel.viewResults')}
            </Link>
          </Button>
        )}
        {hasShareableLink && (
          <Button variant="outline" size="sm" className="w-full" onClick={handleCopyLink}>
            <Share2 className="size-4" aria-hidden />
            {t('actions.share')}
          </Button>
        )}
        {canDuplicate && (
          <Button variant="outline" size="sm" className="w-full" onClick={handleDuplicate}>
            <Copy className="size-4" aria-hidden />
            {t('actions.duplicate')}
          </Button>
        )}
      </div>

      {/* Status transition buttons — data-driven from config */}
      {availableActions.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {availableActions.map((action) => {
            const ui = SURVEY_ACTION_UI[action];
            const Icon = ui.icon;
            const isDestructive = ui.confirm?.variant === 'destructive';
            const isWarning = ui.confirm?.variant === 'warning';

            return (
              <Button
                key={action}
                variant="outline"
                size="sm"
                className={cn(
                  'h-7 gap-1 px-2 text-xs hover:bg-transparent md:hover:bg-transparent',
                  isDestructive &&
                    'text-destructive hover:text-destructive md:hover:text-destructive border-destructive/30 hover:border-destructive/40',
                  isWarning &&
                    'border-amber-500/30 text-amber-600 hover:border-amber-500/40 hover:text-amber-600 md:hover:text-amber-600 dark:text-amber-500 dark:hover:text-amber-500 dark:md:hover:text-amber-500'
                )}
                onClick={() => handleActionClick(action)}
              >
                <Icon className="size-3.5" aria-hidden />
                {t(`actions.${action}`)}
              </Button>
            );
          })}
        </div>
      )}

      {/* Questions */}
      <Separator className="my-4" />
      <SectionLabel>{t('detailPanel.questionsLabel')}</SectionLabel>
      {questions === null ? (
        <div className="text-muted-foreground flex items-center gap-2 py-2 text-xs">
          <Loader2 className="size-3.5 animate-spin" aria-hidden />
          {t('detailPanel.loadingQuestions')}
        </div>
      ) : questions.length === 0 ? (
        <div className="border-border/50 text-muted-foreground flex items-start gap-2 rounded-md border border-dashed px-3 py-2.5 text-xs">
          <HelpCircle className="size-3.5 shrink-0 pt-0.5" aria-hidden />
          <span>{t('detailPanel.questionsEmptyDescription')}</span>
        </div>
      ) : (
        <div className="space-y-1.5">
          {questions.map((q: MappedQuestion, i: number) => {
            const TypeIcon = QUESTION_TYPE_ICONS[q.type];
            const labelKey = QUESTION_TYPE_LABEL_KEYS[q.type];
            const typeLabel = tTypes(labelKey.split('.').pop() as Parameters<typeof tTypes>[0]);

            return (
              <div
                key={q.id}
                className="border-border/50 rounded-md border border-dashed px-3 py-2.5"
              >
                <p className="text-foreground text-xs leading-snug font-medium">
                  <span className="text-muted-foreground tabular-nums">{i + 1}. </span>
                  {q.text || '—'}
                </p>
                <div className="mt-1.5">
                  <span className="bg-secondary text-secondary-foreground inline-flex items-center gap-1 rounded-full border px-1.5 py-0 text-[10px] font-normal">
                    <TypeIcon className="size-3" aria-hidden />
                    {typeLabel}
                  </span>
                  <QuestionConfigDetails question={q} t={t} />
                </div>
              </div>
            );
          })}
        </div>
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
