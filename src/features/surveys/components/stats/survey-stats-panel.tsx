'use client';

import { useState, useTransition } from 'react';

import { Calendar, CheckCircle, Clock, Hash, Inbox, Link2, SquareX } from 'lucide-react';
import { useFormatter, useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ClipboardInput } from '@/components/ui/clipboard-input';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { Separator } from '@/components/ui/separator';
import { useBreadcrumbSegment } from '@/features/dashboard/components/layout/breadcrumb-context';
import { closeSurvey } from '@/features/surveys/actions';
import type { QuestionStats, SurveyStats } from '@/features/surveys/actions/get-survey-stats';
import { env } from '@/lib/common/env';
import { cn } from '@/lib/common/utils';

import { ExportButtons } from './export-buttons';
import { QuestionStatsCard } from './question-stats-card';

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-muted-foreground mb-2 text-[11px] font-medium tracking-wider uppercase">
      {children}
    </p>
  );
}

interface SurveyStatsPanelProps {
  stats: SurveyStats;
}

const STATUS_BADGE_CLASS: Record<string, string> = {
  active: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/25',
  closed: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/25',
};

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
        {Icon != null && <Icon className="size-3.5 shrink-0" aria-hidden />}
        {label}
      </span>
      <span className="text-foreground text-right text-xs font-medium tabular-nums">{value}</span>
    </div>
  );
}

export const SurveyStatsPanel = ({ stats }: SurveyStatsPanelProps) => {
  const t = useTranslations('surveys.stats');
  const locale = useLocale();
  const format = useFormatter();

  useBreadcrumbSegment(stats.survey.id, stats.survey.title);
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [optimisticallyClosed, setOptimisticallyClosed] = useState(false);
  const [, startTransition] = useTransition();

  const isClosed = stats.survey.status === 'closed' || optimisticallyClosed;

  const shareUrl = stats.survey.slug
    ? `${env.NEXT_PUBLIC_APP_URL}/${locale}/r/${stats.survey.slug}`
    : null;

  const handleCloseSurvey = () => {
    startTransition(async () => {
      const result = await closeSurvey({ surveyId: stats.survey.id });

      if (result.success) {
        setOptimisticallyClosed(true);
        toast.success(t('surveyClosed'));
      }

      setShowCloseDialog(false);
    });
  };

  const completionRate =
    stats.totalResponses > 0
      ? Math.round((stats.completedResponses / stats.totalResponses) * 100)
      : null;

  const respondentProgress =
    stats.survey.maxRespondents != null &&
    stats.survey.maxRespondents > 0 &&
    Math.min(100, Math.round((stats.completedResponses / stats.survey.maxRespondents) * 100));

  const formatDate = (iso: string) =>
    format.dateTime(new Date(iso), { month: 'short', day: 'numeric', year: 'numeric' });

  const hasDetails = stats.survey.startsAt != null || stats.survey.endsAt != null;

  const handleCopyEmpty = async () => {
    if (shareUrl) {
      await navigator.clipboard.writeText(shareUrl);
      toast.success(t('linkCopied'));
    }
  };

  return (
    <main className="flex min-w-0 flex-col" aria-label={stats.survey.title}>
      <div className="space-y-6">
        <div className="flex min-w-0 flex-col gap-4">
          <div className="flex min-w-0 flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h1 className="text-foreground min-w-0 truncate text-3xl leading-tight font-bold">
                {stats.survey.title}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <Badge
                  variant={isClosed ? 'outline' : 'default'}
                  className={cn(
                    'text-[11px]',
                    isClosed ? STATUS_BADGE_CLASS.closed : STATUS_BADGE_CLASS.active
                  )}
                >
                  {isClosed ? t('statusClosed') : t('statusActive')}
                </Badge>
              </div>
            </div>
            <div className="flex shrink-0 gap-2">
              {!isClosed && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCloseDialog(true)}
                  className="gap-1.5"
                >
                  <SquareX className="size-3.5" aria-hidden />
                  {t('closeSurvey')}
                </Button>
              )}
              <ExportButtons surveyId={stats.survey.id} />
            </div>
          </div>

          {shareUrl && (
            <>
              <Separator />
              <SectionLabel>{t('surveyLink')}</SectionLabel>
              <div className="flex items-center gap-2">
                <Link2 className="text-muted-foreground size-4 shrink-0" aria-hidden />
                <ClipboardInput value={shareUrl} className="max-w-md" />
              </div>
            </>
          )}
        </div>

        <Separator />

        <SectionLabel>{t('metricsLabel')}</SectionLabel>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div className="border-border/50 rounded-md border px-3 py-2.5">
            <div className="text-foreground text-lg leading-none font-semibold tabular-nums">
              {stats.totalResponses}
            </div>
            <div className="text-muted-foreground mt-1.5 flex items-center gap-1 text-[11px]">
              <Hash className="size-3" aria-hidden />
              {t('totalResponses')}
            </div>
          </div>
          <div className="border-border/50 rounded-md border px-3 py-2.5">
            <div className="text-foreground text-lg leading-none font-semibold tabular-nums">
              {stats.completedResponses}
              {stats.survey.maxRespondents != null && (
                <span className="text-muted-foreground text-xs font-normal">
                  {' '}
                  / {stats.survey.maxRespondents}
                </span>
              )}
            </div>
            <div className="text-muted-foreground mt-1.5 flex items-center gap-1 text-[11px]">
              <CheckCircle className="size-3" aria-hidden />
              {t('completedResponses')}
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
            <div className="text-foreground text-lg leading-none font-semibold tabular-nums">
              {stats.inProgressResponses}
            </div>
            <div className="text-muted-foreground mt-1.5 flex items-center gap-1 text-[11px]">
              <Clock className="size-3" aria-hidden />
              {t('inProgress')}
            </div>
            {stats.inProgressResponses > 0 && (
              <p className="text-muted-foreground mt-1 text-[10px]">{t('inProgressHint')}</p>
            )}
          </div>
          {completionRate !== null && (
            <div className="border-border/50 rounded-md border px-3 py-2.5">
              <div className="text-foreground text-lg leading-none font-semibold tabular-nums">
                {completionRate}%
              </div>
              <div className="text-muted-foreground mt-1.5 text-[11px]">{t('completionRate')}</div>
            </div>
          )}
        </div>

        {stats.completedResponses === 0 ? (
          <EmptyState
            icon={Inbox}
            title={t('noResponses')}
            description={t('noResponsesDescription')}
            action={
              shareUrl ? (
                <Button size="sm" onClick={handleCopyEmpty} className="gap-1.5">
                  <Link2 className="size-4" aria-hidden />
                  {t('copySurveyLink')}
                </Button>
              ) : undefined
            }
          />
        ) : (
          <>
            <Separator />
            <SectionLabel>{t('questionBreakdown')}</SectionLabel>
            <div className="space-y-3">
              {stats.questions.map((q: QuestionStats, i: number) => (
                <QuestionStatsCard
                  key={q.id}
                  question={q}
                  index={i}
                  completedResponses={stats.completedResponses}
                />
              ))}
            </div>
          </>
        )}

        {hasDetails && (
          <>
            <Separator />
            <SectionLabel>{t('detailsLabel')}</SectionLabel>
            <div className="space-y-2">
              {stats.survey.startsAt != null && (
                <MetricRow
                  icon={Calendar}
                  label={t('startsAt')}
                  value={formatDate(stats.survey.startsAt)}
                />
              )}
              {stats.survey.endsAt != null && (
                <MetricRow
                  icon={Calendar}
                  label={t('endsAt')}
                  value={formatDate(stats.survey.endsAt)}
                />
              )}
            </div>
          </>
        )}
      </div>

      <ConfirmDialog
        open={showCloseDialog}
        onOpenChange={setShowCloseDialog}
        onConfirm={handleCloseSurvey}
        title={t('closeSurvey')}
        description={t('closeSurveyConfirm')}
        confirmLabel={t('closeSurvey')}
      />
    </main>
  );
};
