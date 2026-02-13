'use client';

import { useState, useTransition } from 'react';

import { Inbox, Link2, SquareX } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ClipboardInput } from '@/components/ui/clipboard-input';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { useBreadcrumbSegment } from '@/features/dashboard/components/layout/breadcrumb-context';
import { closeSurvey } from '@/features/surveys/actions';
import type { SurveyStats } from '@/features/surveys/actions/get-survey-stats';
import { env } from '@/lib/common/env';

import { ExportButtons } from './export-buttons';
import { QuestionStatsCard } from './question-stats-card';

interface SurveyStatsPanelProps {
  stats: SurveyStats;
}

export const SurveyStatsPanel = ({ stats }: SurveyStatsPanelProps) => {
  const t = useTranslations('surveys.stats');
  const locale = useLocale();

  // Register survey title as a dynamic breadcrumb segment for the UUID in the URL
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

  const statusVariant = isClosed ? 'secondary' : 'default';

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-foreground text-xl font-semibold">{stats.survey.title}</h1>
            <Badge variant={statusVariant}>
              {isClosed ? t('statusClosed') : t('statusActive')}
            </Badge>
          </div>
          <div className="flex gap-2">
            {!isClosed && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCloseDialog(true)}
                className="gap-1.5"
              >
                <SquareX className="size-3.5" />
                {t('closeSurvey')}
              </Button>
            )}
            <ExportButtons surveyId={stats.survey.id} />
          </div>
        </div>

        {shareUrl && (
          <div className="flex items-center gap-2">
            <Link2 className="text-muted-foreground size-4 shrink-0" />
            <ClipboardInput value={shareUrl} className="max-w-md" />
          </div>
        )}
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">
              {t('totalResponses')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-foreground text-2xl font-bold">{stats.totalResponses}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">
              {t('completedResponses')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-foreground text-2xl font-bold">{stats.completedResponses}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">
              {t('inProgress')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-foreground text-2xl font-bold">{stats.inProgressResponses}</p>
          </CardContent>
        </Card>
      </div>

      {/* Respondent limit progress */}
      {stats.survey.maxRespondents && (
        <p className="text-muted-foreground text-sm">
          {t('progressToLimit', {
            count: stats.completedResponses,
            max: stats.survey.maxRespondents,
          })}
        </p>
      )}

      {/* Question Breakdown */}
      {stats.completedResponses === 0 ? (
        <EmptyState
          icon={Inbox}
          title={t('noResponses')}
          description={t('noResponsesDescription')}
        />
      ) : (
        <div className="space-y-4">
          <h2 className="text-foreground text-lg font-semibold">{t('questionBreakdown')}</h2>
          {stats.questions.map((q, i) => (
            <QuestionStatsCard key={q.id} question={q} index={i} />
          ))}
        </div>
      )}

      <ConfirmDialog
        open={showCloseDialog}
        onOpenChange={setShowCloseDialog}
        onConfirm={handleCloseSurvey}
        title={t('closeSurvey')}
        description={t('closeSurveyConfirm')}
        confirmLabel={t('closeSurvey')}
      />
    </div>
  );
};
