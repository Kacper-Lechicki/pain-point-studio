'use client';

import { useEffect, useState, useTransition } from 'react';

import { Clock, MessageSquare, ShieldCheck, Users } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { PageTransition } from '@/components/ui/page-transition';
import { startResponse } from '@/features/surveys/actions/respondent';
import { ESTIMATED_SECONDS_PER_QUESTION } from '@/features/surveys/config';
import type { CompletedData, PublicSurveyData } from '@/features/surveys/types';
import type { MessageKey } from '@/i18n/types';

import { SurveyFlow } from './survey-flow';

interface SurveyLandingProps {
  survey: PublicSurveyData;
  slug: string;
}

export const SurveyLanding = ({ survey, slug }: SurveyLandingProps) => {
  const t = useTranslations();
  const tLanding = useTranslations('respondent.landing');
  const [responseId, setResponseId] = useState<string | null>(null);
  const [completedData, setCompletedData] = useState<CompletedData | null>(null);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    try {
      const stored = localStorage.getItem(`pps_completed_${slug}`);

      if (stored) {
        const parsed = JSON.parse(stored) as CompletedData;
        queueMicrotask(() => {
          setCompletedData(parsed);
          setShowDuplicateWarning(true);
        });
      }
    } catch {
      // localStorage may not be available
    }
  }, [slug]);

  const handleStart = () => {
    startTransition(async () => {
      const result = await startResponse({ surveyId: survey.id });

      if (result.success && result.data) {
        setResponseId(result.data.responseId);
      } else if (result.error) {
        toast.error(t(result.error as MessageKey));
      }
    });
  };

  // If survey flow is active, render it
  if (responseId) {
    return <SurveyFlow survey={survey} responseId={responseId} slug={slug} />;
  }

  const estimatedMinutes = Math.max(
    1,
    Math.round((survey.questionCount * ESTIMATED_SECONDS_PER_QUESTION) / 60)
  );

  return (
    <PageTransition>
      <div className="flex flex-col items-center py-8 text-center sm:py-16">
        <h1 className="text-foreground mb-3 text-2xl font-bold sm:text-3xl">{survey.title}</h1>
        <p className="text-muted-foreground mb-8 max-w-lg text-sm leading-relaxed sm:text-base">
          {survey.description}
        </p>

        <div className="text-muted-foreground mb-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm">
          <span className="flex items-center gap-1.5">
            <MessageSquare className="size-4" />
            {tLanding('questionsCount', { count: survey.questionCount })}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="size-4" />
            {tLanding('estimatedTime', { minutes: estimatedMinutes })}
          </span>
          {survey.responseCount > 0 && (
            <span className="flex items-center gap-1.5">
              <Users className="size-4" />
              {tLanding('responsesCount', { count: survey.responseCount })}
            </span>
          )}
        </div>

        <div className="text-muted-foreground mb-8 flex items-center gap-1.5 text-xs">
          <ShieldCheck className="size-3.5" />
          {tLanding('anonymousInfo')}
        </div>

        {showDuplicateWarning && completedData ? (
          <div className="bg-muted mb-6 w-full max-w-sm rounded-lg p-4 text-center">
            <p className="text-foreground mb-1 text-sm font-medium">
              {tLanding('alreadyCompleted.title')}
            </p>
            <p className="text-muted-foreground mb-3 text-xs">
              {tLanding('alreadyCompleted.description', {
                date: new Date(completedData.timestamp).toLocaleDateString(),
              })}
            </p>
            <Button variant="outline" size="sm" onClick={() => setShowDuplicateWarning(false)}>
              {tLanding('alreadyCompleted.respondAgain')}
            </Button>
          </div>
        ) : (
          <Button onClick={handleStart} disabled={isPending} className="min-w-48">
            {tLanding('start')}
          </Button>
        )}
      </div>
    </PageTransition>
  );
};
