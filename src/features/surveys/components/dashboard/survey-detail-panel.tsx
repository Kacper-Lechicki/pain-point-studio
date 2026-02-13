'use client';

import { useState, useTransition } from 'react';

import {
  Archive,
  BarChart3,
  Calendar,
  Copy,
  Expand,
  Hash,
  Loader2,
  Pencil,
  RotateCcw,
  Share2,
  SquareX,
  Tag,
  Trash2,
  Users,
} from 'lucide-react';
import { useFormatter, useLocale, useNow, useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Separator } from '@/components/ui/separator';
import {
  archiveSurvey,
  closeSurvey,
  deleteSurveyDraft,
  reopenSurvey,
  restoreSurvey,
} from '@/features/surveys/actions';
import type { UserSurvey } from '@/features/surveys/actions/get-user-surveys';
import { QUESTION_TYPE_ICONS, QUESTION_TYPE_LABEL_KEYS } from '@/features/surveys/config';
import type { MappedQuestion } from '@/features/surveys/lib/map-question-row';
import type { SurveyStatus } from '@/features/surveys/types';
import Link from '@/i18n/link';
import { env } from '@/lib/common/env';
import { cn } from '@/lib/common/utils';

import { Sparkline, getSparklineColor } from './sparkline';

const STATUS_BADGE_VARIANT: Record<SurveyStatus, 'default' | 'secondary' | 'outline'> = {
  active: 'default',
  draft: 'secondary',
  closed: 'outline',
  archived: 'secondary',
};

const STATUS_BADGE_CLASS: Record<SurveyStatus, string> = {
  active: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/25',
  draft: '',
  closed: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/25',
  archived: 'opacity-60',
};

type ConfirmableAction = 'close' | 'archive' | 'delete';

const ACTION_CONFIGS = {
  close: {
    fn: closeSurvey,
    toastKey: 'toast.closed',
    confirm: {
      titleKey: 'confirm.closeTitle',
      descriptionKey: 'confirm.closeDescription',
      variant: 'destructive' as const,
    },
  },
  reopen: { fn: reopenSurvey, toastKey: 'toast.reopened' },
  archive: {
    fn: archiveSurvey,
    toastKey: 'toast.archived',
    confirm: {
      titleKey: 'confirm.archiveTitle',
      descriptionKey: 'confirm.archiveDescription',
      variant: 'warning' as const,
    },
  },
  delete: {
    fn: deleteSurveyDraft,
    toastKey: 'toast.deleted',
    confirm: {
      titleKey: 'confirm.deleteTitle',
      descriptionKey: 'confirm.deleteDescription',
      variant: 'destructive' as const,
    },
  },
} as const;

interface SurveyDetailPanelProps {
  survey: UserSurvey;
  questions: MappedQuestion[] | null;
  onStatusChange: (surveyId: string, action: string) => void;
  embeddedInSheet?: boolean;
  /** When true, renders as full-page content (main, no sticky). */
  embeddedInPage?: boolean;
}

function MetricRow({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
        {Icon && <Icon className="size-3.5 shrink-0" />}
        {label}
      </span>
      <span className="text-foreground text-right text-xs font-medium tabular-nums">{value}</span>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-muted-foreground mb-2 text-[11px] font-medium tracking-wider uppercase">
      {children}
    </p>
  );
}

function QuestionConfigDetails({
  question,
  t,
}: {
  question: MappedQuestion;
  t: ReturnType<typeof useTranslations<'surveys.dashboard'>>;
}) {
  const config = question.config;
  const details: string[] = [];

  if (question.type === 'multiple_choice') {
    const options = (config.options as string[] | undefined) ?? [];
    details.push(t('detailPanel.optionsCount', { count: options.length }));

    if (config.allowOther) {
      details.push(t('detailPanel.allowOther'));
    }
  }

  if (question.type === 'rating_scale') {
    const min = (config.min as number | undefined) ?? 1;
    const max = (config.max as number | undefined) ?? 5;
    const minLabel = config.minLabel as string | undefined;
    const maxLabel = config.maxLabel as string | undefined;

    details.push(t('detailPanel.scale', { min, max }));

    if (minLabel) {
      details.push(minLabel);
    }

    if (maxLabel) {
      details.push(maxLabel);
    }
  }

  if (details.length === 0) {
    return null;
  }

  return (
    <div className="text-muted-foreground mt-1.5 flex flex-wrap gap-1">
      {details.map((detail) => (
        <span key={detail} className="bg-muted rounded px-1.5 py-0.5 text-[10px]">
          {detail}
        </span>
      ))}
    </div>
  );
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
  const [, startTransition] = useTransition();
  const [confirmDialog, setConfirmDialog] = useState<ConfirmableAction | null>(null);

  const isDraft = survey.status === 'draft';
  const isActive = survey.status === 'active';
  const isClosed = survey.status === 'closed';
  const isArchived = survey.status === 'archived';
  const shareUrl = survey.slug ? `${env.NEXT_PUBLIC_APP_URL}/${locale}/r/${survey.slug}` : null;
  const sparklineColor = getSparklineColor(survey.recentActivity);
  const completionRate =
    survey.responseCount > 0
      ? Math.round((survey.completedCount / survey.responseCount) * 100)
      : null;
  const lastResponseLabel =
    survey.lastResponseAt != null
      ? format.relativeTime(new Date(survey.lastResponseAt), now)
      : null;
  const respondentProgress =
    survey.maxRespondents != null && survey.maxRespondents > 0
      ? Math.min(100, Math.round((survey.completedCount / survey.maxRespondents) * 100))
      : null;

  const handleCopyLink = async () => {
    if (!shareUrl) {
      return;
    }

    await navigator.clipboard.writeText(shareUrl);
    toast.success(t('detailPanel.linkCopied'));
  };

  const tArchive = useTranslations('surveys.archive');

  const handleAction = (action: ConfirmableAction | 'reopen' | 'restore') => {
    startTransition(async () => {
      const fn = action === 'restore' ? restoreSurvey : ACTION_CONFIGS[action].fn;
      const result = await fn({ surveyId: survey.id });

      setConfirmDialog(null);

      if (result.success) {
        if (action === 'restore') {
          toast.success(tArchive('toast.restored'));
        } else {
          toast.success(t(ACTION_CONFIGS[action].toastKey));
        }

        onStatusChange(survey.id, action);
      } else {
        toast.error(t('toast.actionFailed'));
      }
    });
  };

  const formatDate = (iso: string) =>
    format.dateTime(new Date(iso), { month: 'short', day: 'numeric', year: 'numeric' });

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
            <Link href={`/dashboard/surveys/${survey.id}`}>
              <Expand className="size-4" aria-hidden />
            </Link>
          </Button>
        )}
      </div>

      {/* Status + Category */}
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <Badge
          variant={STATUS_BADGE_VARIANT[survey.status]}
          className={cn('text-[11px]', STATUS_BADGE_CLASS[survey.status])}
        >
          {t(`status.${survey.status}`)}
        </Badge>
        {survey.category && (
          <Badge variant="outline" className="text-[11px] font-normal">
            {tCat(survey.category as Parameters<typeof tCat>[0])}
          </Badge>
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
      </div>

      {/* Share URL (active only) */}
      {isActive && shareUrl && (
        <>
          <Separator className="my-4" />
          <SectionLabel>{t('detailPanel.surveyLink')}</SectionLabel>
          <button
            type="button"
            onClick={handleCopyLink}
            className="bg-muted/50 hover:bg-muted group flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left transition-colors"
          >
            <span className="text-muted-foreground min-w-0 flex-1 truncate text-[11px]">
              {shareUrl.replace(/^https?:\/\//, '')}
            </span>
            <Copy className="text-muted-foreground group-hover:text-foreground size-3.5 shrink-0 transition-colors" />
          </button>
        </>
      )}

      <Separator className="my-4" />

      {/* Actions */}
      <SectionLabel>{t('detailPanel.actionsLabel')}</SectionLabel>
      <div className="flex flex-col gap-2">
        {isDraft ? (
          <Button asChild size="sm" className="w-full">
            <Link href={`/dashboard/surveys/new/${survey.id}`}>
              <Pencil className="size-4" aria-hidden />
              {t('actions.edit')}
            </Link>
          </Button>
        ) : (
          <Button asChild size="sm" className="w-full">
            <Link href={`/dashboard/surveys/stats/${survey.id}`}>
              <BarChart3 className="size-4" aria-hidden />
              {t('detailPanel.viewResults')}
            </Link>
          </Button>
        )}
        {isActive && shareUrl && (
          <Button variant="outline" size="sm" className="w-full" onClick={handleCopyLink}>
            <Share2 className="size-4" aria-hidden />
            {t('actions.share')}
          </Button>
        )}
      </div>
      {(isActive || isClosed || isDraft || isArchived) && (
        <div className="border-border/50 mt-3 flex flex-wrap gap-1.5 border-t pt-3">
          {isArchived && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 gap-1 px-2 text-xs hover:bg-transparent md:hover:bg-transparent"
              onClick={() => handleAction('restore')}
            >
              <RotateCcw className="size-3.5" aria-hidden />
              {tArchive('actions.restore')}
            </Button>
          )}
          {isActive && (
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:text-destructive md:hover:text-destructive border-destructive/30 hover:border-destructive/40 h-7 gap-1 px-2 text-xs hover:bg-transparent md:hover:bg-transparent"
              onClick={() => setConfirmDialog('close')}
            >
              <SquareX className="size-3.5" aria-hidden />
              {t('actions.close')}
            </Button>
          )}
          {isClosed && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 gap-1 px-2 text-xs hover:bg-transparent md:hover:bg-transparent"
              onClick={() => handleAction('reopen')}
            >
              <RotateCcw className="size-3.5" aria-hidden />
              {t('actions.reopen')}
            </Button>
          )}
          {(isActive || isClosed) && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 gap-1 border-amber-500/30 px-2 text-xs text-amber-600 hover:border-amber-500/40 hover:bg-transparent hover:text-amber-600 md:hover:bg-transparent md:hover:text-amber-600 dark:text-amber-500 dark:hover:text-amber-500 dark:md:hover:text-amber-500"
              onClick={() => setConfirmDialog('archive')}
            >
              <Archive className="size-3.5" aria-hidden />
              {t('actions.archive')}
            </Button>
          )}
          {isDraft && (
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:text-destructive md:hover:text-destructive border-destructive/30 hover:border-destructive/40 h-7 gap-1 px-2 text-xs hover:bg-transparent md:hover:bg-transparent"
              onClick={() => setConfirmDialog('delete')}
            >
              <Trash2 className="size-3.5" aria-hidden />
              {t('actions.delete')}
            </Button>
          )}
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
      ) : (
        <div className="space-y-1.5">
          {questions.map((q, i) => {
            const TypeIcon = QUESTION_TYPE_ICONS[q.type];
            const labelKey = QUESTION_TYPE_LABEL_KEYS[q.type];
            const typeLabel = tTypes(labelKey.split('.').pop() as Parameters<typeof tTypes>[0]);

            return (
              <div
                key={q.id}
                className="border-border/50 rounded-md border border-dashed px-3 py-2.5"
              >
                {/* Question number + text */}
                <p className="text-foreground text-xs leading-snug font-medium">
                  <span className="text-muted-foreground tabular-nums">{i + 1}.</span>{' '}
                  {q.text || '—'}
                </p>

                {/* Type + required badges */}
                <div className="mt-1.5 flex flex-wrap items-center gap-1">
                  <Badge variant="secondary" className="gap-1 px-1.5 py-0 text-[10px] font-normal">
                    <TypeIcon className="size-3" aria-hidden />
                    {typeLabel}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={cn(
                      'px-1.5 py-0 text-[10px] font-normal',
                      q.required && 'border-emerald-500/30 text-emerald-700 dark:text-emerald-400'
                    )}
                  >
                    {q.required ? t('detailPanel.required') : t('detailPanel.optional')}
                  </Badge>
                </div>

                {/* Config details */}
                <QuestionConfigDetails question={q} t={t} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const confirmDialogElement = confirmDialog && (
    <ConfirmDialog
      open
      onOpenChange={(open) => !open && setConfirmDialog(null)}
      onConfirm={() => handleAction(confirmDialog)}
      title={t(ACTION_CONFIGS[confirmDialog].confirm.titleKey as Parameters<typeof t>[0])}
      description={t(
        ACTION_CONFIGS[confirmDialog].confirm.descriptionKey as Parameters<typeof t>[0]
      )}
      confirmLabel={t(`actions.${confirmDialog}`)}
      variant={ACTION_CONFIGS[confirmDialog].confirm.variant}
    />
  );

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
