'use client';

import { useCallback, useEffect, useState } from 'react';

import { ArrowLeft, ArrowRight, SkipForward } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { PageTransition } from '@/components/ui/page-transition';
import { checkSurveyStatus } from '@/features/surveys/actions/respondent';
import { QuestionRenderer } from '@/features/surveys/components/respondent/question-renderers';
import { SurveyClosed } from '@/features/surveys/components/respondent/survey-closed';
import { SurveyCompletion } from '@/features/surveys/components/respondent/survey-completion';
import { SurveyProgress } from '@/features/surveys/components/respondent/survey-progress';
import { SurveyThankYou } from '@/features/surveys/components/respondent/survey-thank-you';
import { useSurveyFlow } from '@/features/surveys/hooks/use-survey-flow';
import type { ClosedReason, PublicSurveyData } from '@/features/surveys/types';

const POLL_INTERVAL_MS = 30_000;

type FlowScreen = 'questions' | 'completion' | 'thank-you';

interface SurveyFlowProps {
  survey: PublicSurveyData;
  responseId: string;
  slug: string;
}

export const SurveyFlow = ({ survey, responseId, slug }: SurveyFlowProps) => {
  const t = useTranslations();
  const tErrors = useTranslations();
  const [screen, setScreen] = useState<FlowScreen>('questions');
  const [closedReason, setClosedReason] = useState<ClosedReason | null>(null);

  // Poll survey status every 30s to detect closure in real-time
  useEffect(() => {
    const interval = setInterval(async () => {
      const status = await checkSurveyStatus(survey.id);

      if (status && status !== 'active') {
        setClosedReason(status === 'cancelled' ? 'cancelled' : 'completed');
        clearInterval(interval);
      }
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [survey.id]);

  const handleSaveError = useCallback(
    (errorKey?: string) => {
      // If error is a survey-closed error, show closed screen immediately
      if (errorKey && errorKey.includes('closed.')) {
        setClosedReason('completed');

        return;
      }

      toast.error(tErrors('respondent.errors.saveFailed'));
    },
    [tErrors]
  );

  const handleSurveyClosed = useCallback(() => {
    setClosedReason('completed');
  }, []);

  const {
    currentIndex,
    currentQuestion,
    currentAnswer,
    answeredCount,
    isComplete,
    updateAnswer,
    goToNext,
    goToPrevious,
    skip,
    goToQuestion,
  } = useSurveyFlow({ questions: survey.questions, responseId, onSaveError: handleSaveError });

  // Show closed screen if survey was closed mid-flow
  if (closedReason) {
    return <SurveyClosed title={survey.title} reason={closedReason} />;
  }

  const effectiveScreen: FlowScreen =
    screen === 'thank-you'
      ? 'thank-you'
      : screen === 'completion' || (screen === 'questions' && isComplete)
        ? 'completion'
        : 'questions';

  if (effectiveScreen === 'thank-you') {
    return <SurveyThankYou />;
  }

  if (effectiveScreen === 'completion') {
    return (
      <SurveyCompletion
        responseId={responseId}
        answeredCount={answeredCount}
        totalQuestions={survey.questionCount}
        slug={slug}
        onSubmitted={() => setScreen('thank-you')}
        onBack={() => {
          setScreen('questions');
          goToQuestion(survey.questions.length - 1);
        }}
        onSurveyClosed={handleSurveyClosed}
      />
    );
  }

  if (!currentQuestion) {
    return null;
  }

  const isFirst = currentIndex === 0;
  const isLast = currentIndex === survey.questions.length - 1;

  return (
    <PageTransition key={currentQuestion.id}>
      <div className="flex min-h-[60vh] flex-col">
        <SurveyProgress current={currentIndex + 1} total={survey.questions.length} />

        <div className="flex-1">
          <div className="mb-6">
            <div className="mb-2">
              <h2 className="text-foreground text-lg font-medium">{currentQuestion.text}</h2>
            </div>

            {currentQuestion.description && (
              <p className="text-muted-foreground text-xs">{currentQuestion.description}</p>
            )}
          </div>

          <QuestionRenderer
            question={currentQuestion}
            value={currentAnswer}
            onChange={updateAnswer}
          />
        </div>

        <div className="mt-8 flex items-center justify-between gap-3">
          <Button variant="ghost" onClick={goToPrevious} disabled={isFirst} className="gap-1.5">
            <ArrowLeft className="size-4" />
            {t('respondent.flow.previous')}
          </Button>

          <div className="flex gap-2">
            <Button variant="ghost" onClick={skip} className="gap-1.5">
              {t('respondent.flow.skip')}
              <SkipForward className="size-4" />
            </Button>

            <Button onClick={goToNext} className="gap-1.5">
              {isLast ? t('respondent.flow.finish') : t('respondent.flow.next')}
              {!isLast && <ArrowRight className="size-4" />}
            </Button>
          </div>
        </div>
      </div>
    </PageTransition>
  );
};
