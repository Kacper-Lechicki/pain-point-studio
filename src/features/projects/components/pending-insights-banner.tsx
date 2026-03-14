'use client';

import { useState, useTransition } from 'react';

import { CheckCircle2, ClipboardList, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { SurveyStatusBadge } from '@/components/shared/survey-status-badge';
import { Button } from '@/components/ui/button';
import type { PendingInsightSurvey } from '@/features/projects/actions/get-pending-insight-surveys';
import { setSurveyInsightPreference } from '@/features/projects/actions/set-survey-insight-preference';
import type { SurveyStatus } from '@/features/surveys/types';
import type { MessageKey } from '@/i18n/types';

interface PendingInsightsBannerProps {
  surveys: PendingInsightSurvey[];
  onDecided: (surveyId: string, included: boolean) => void;
}

export function PendingInsightsBanner({ surveys, onDecided }: PendingInsightsBannerProps) {
  const t = useTranslations();
  const [isPending, startTransition] = useTransition();
  const [localSurveys, setLocalSurveys] = useState(surveys);

  if (localSurveys.length === 0) {
    return null;
  }

  const handleDecision = (surveyId: string, include: boolean) => {
    setLocalSurveys((prev) => prev.filter((s) => s.id !== surveyId));

    startTransition(async () => {
      const result = await setSurveyInsightPreference({
        surveyId,
        generateInsights: include,
      });

      if (result.success) {
        toast.success(
          t(
            (include
              ? 'projects.insights.pending.included'
              : 'projects.insights.pending.excluded') as MessageKey
          )
        );
        onDecided(surveyId, include);
      } else {
        setLocalSurveys((prev) => {
          const survey = surveys.find((s) => s.id === surveyId);

          return survey ? [...prev, survey] : prev;
        });
        toast.error(t('projects.errors.unexpected' as MessageKey));
      }
    });
  };

  const handleIncludeAll = () => {
    const ids = localSurveys.map((s) => s.id);
    setLocalSurveys([]);

    startTransition(async () => {
      const results = await Promise.allSettled(
        ids.map((id) => setSurveyInsightPreference({ surveyId: id, generateInsights: true }))
      );

      const failed = results.filter((r) => r.status === 'rejected' || !r.value.success);

      if (failed.length === 0) {
        toast.success(t('projects.insights.pending.included' as MessageKey));
        ids.forEach((id) => onDecided(id, true));
      } else {
        toast.error(t('projects.errors.unexpected' as MessageKey));
      }
    });
  };

  return (
    <div
      data-testid="pending-insights-banner"
      className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30"
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ClipboardList className="size-4 text-amber-700 dark:text-amber-300" aria-hidden />
          <h3 className="text-sm font-medium text-amber-900 dark:text-amber-100">
            {t('projects.insights.pending.title' as MessageKey)}
          </h3>
        </div>

        {localSurveys.length > 1 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-amber-700 hover:text-amber-900 dark:text-amber-300 dark:hover:text-amber-100"
            onClick={handleIncludeAll}
            disabled={isPending}
          >
            {t('projects.insights.pending.includeAll' as MessageKey)}
          </Button>
        )}
      </div>

      <p className="mb-3 text-xs text-amber-800 dark:text-amber-200">
        {t('projects.insights.pending.description' as MessageKey)}
      </p>

      <div className="flex flex-col gap-2">
        {localSurveys.map((survey) => (
          <div
            key={survey.id}
            data-testid={`pending-survey-${survey.id}`}
            className="flex items-center justify-between gap-3 rounded-lg border border-amber-200/60 bg-white px-3 py-2 dark:border-amber-700/40 dark:bg-amber-950/50"
          >
            <div className="flex min-w-0 items-center gap-2">
              <span className="text-foreground truncate text-sm font-medium">{survey.title}</span>
              <SurveyStatusBadge status={survey.status as SurveyStatus} />
              <span className="text-muted-foreground shrink-0 text-xs">
                {t('projects.insights.pending.responses' as MessageKey, {
                  count: survey.totalResponses,
                })}
              </span>
            </div>

            <div className="flex shrink-0 items-center gap-1.5">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => handleDecision(survey.id, true)}
                disabled={isPending}
                aria-label={t('projects.insights.pending.include' as MessageKey)}
              >
                <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => handleDecision(survey.id, false)}
                disabled={isPending}
                aria-label={t('projects.insights.pending.exclude' as MessageKey)}
              >
                <X className="text-muted-foreground size-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
