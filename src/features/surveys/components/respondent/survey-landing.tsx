'use client';

import { useEffect, useState, useTransition } from 'react';

import { Clock, MessageSquare, ShieldCheck, Users } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { PageTransition } from '@/components/ui/page-transition';
import { startResponse } from '@/features/surveys/actions/respondent';
import { SurveyFlow } from '@/features/surveys/components/respondent/survey-flow';
import { ESTIMATED_SECONDS_PER_QUESTION, surveyCompletedKey } from '@/features/surveys/config';
import { detectDeviceType } from '@/features/surveys/lib/detect-device';
import type { CompletedData, PublicSurveyData } from '@/features/surveys/types';
import type { MessageKey } from '@/i18n/types';

interface SurveyLandingProps {
  survey: PublicSurveyData;
  slug: string;
}

export const SurveyLanding = ({ survey, slug }: SurveyLandingProps) => {
  const t = useTranslations();
  const tLanding = useTranslations();
  const [responseId, setResponseId] = useState<string | null>(null);
  const [completedData, setCompletedData] = useState<CompletedData | null>(null);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    try {
      const stored = localStorage.getItem(surveyCompletedKey(slug));

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
      const result = await startResponse({ surveyId: survey.id, deviceType: detectDeviceType() });

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
            {tLanding('respondent.landing.questionsCount', { count: survey.questionCount })}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="size-4" />
            {tLanding('respondent.landing.estimatedTime', { minutes: estimatedMinutes })}
          </span>
          {survey.responseCount > 0 && (
            <span className="flex items-center gap-1.5">
              <Users className="size-4" />
              {tLanding('respondent.landing.responsesCount', { count: survey.responseCount })}
            </span>
          )}
        </div>

        <div className="text-muted-foreground mb-8 flex items-center gap-1.5 text-xs">
          <ShieldCheck className="size-3.5" />
          {tLanding('respondent.landing.anonymousInfo')}
        </div>

        {showDuplicateWarning && completedData ? (
          <div className="bg-muted mb-6 w-full max-w-sm rounded-lg p-4 text-center">
            <p className="text-foreground mb-1 text-sm font-medium">
              {tLanding('respondent.landing.alreadyCompleted.title')}
            </p>
            <p className="text-muted-foreground mb-3 text-xs">
              {tLanding('respondent.landing.alreadyCompleted.description', {
                date: new Date(completedData.timestamp).toLocaleDateString(),
              })}
            </p>
            <Button variant="outline" size="sm" onClick={() => setShowDuplicateWarning(false)}>
              {tLanding('respondent.landing.alreadyCompleted.respondAgain')}
            </Button>
          </div>
        ) : (
          <Button onClick={handleStart} disabled={isPending} className="min-w-48">
            {tLanding('respondent.landing.start')}
          </Button>
        )}
      </div>
    </PageTransition>
  );
};
