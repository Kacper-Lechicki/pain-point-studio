'use client';

import { useCallback, useRef, useState, useTransition } from 'react';

import { saveAnswer } from '@/features/surveys/actions/respondent';
import { isAnswerEmpty } from '@/features/surveys/lib/answer-utils';
import type { PublicSurveyQuestion } from '@/features/surveys/types';

type AnswerMap = Map<string, Record<string, unknown>>;

interface UseSurveyFlowProps {
  questions: PublicSurveyQuestion[];
  responseId: string;
  onSaveError?: (errorKey?: string) => void;
}

export function useSurveyFlow({ questions, responseId, onSaveError }: UseSurveyFlowProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswerMap>(new Map());
  const [isComplete, setIsComplete] = useState(false);
  const [, startTransition] = useTransition();
  const lastSavedRef = useRef<Map<string, string>>(new Map());
  const currentQuestion = questions[currentIndex];
  const currentAnswer = answers.get(currentQuestion?.id ?? '') ?? {};
  const answeredCount = Array.from(answers.entries()).filter(([, v]) => !isAnswerEmpty(v)).length;

  const updateAnswer = useCallback(
    (value: Record<string, unknown>) => {
      if (!currentQuestion) {
        return;
      }

      setAnswers((prev) => {
        const next = new Map(prev);

        next.set(currentQuestion.id, value);

        return next;
      });
    },
    [currentQuestion]
  );

  const persistAnswer = useCallback(
    (questionId: string) => {
      const value = answers.get(questionId);

      if (!value || isAnswerEmpty(value)) {
        return;
      }

      // Skip if already saved with same serialized value
      const serialized = JSON.stringify(value);

      if (lastSavedRef.current.get(questionId) === serialized) {
        return;
      }

      lastSavedRef.current.set(questionId, serialized);

      startTransition(async () => {
        const result = await saveAnswer({ responseId, questionId, value });

        if (result?.error) {
          // Allow retry by clearing the saved ref
          lastSavedRef.current.delete(questionId);
          onSaveError?.(result.error);
        }
      });
    },
    [answers, responseId, onSaveError]
  );

  const goToNext = useCallback(() => {
    if (currentQuestion) {
      persistAnswer(currentQuestion.id);
    }

    if (currentIndex < questions.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      setIsComplete(true);
    }
  }, [currentIndex, currentQuestion, persistAnswer, questions.length]);

  const goToPrevious = useCallback(() => {
    if (currentQuestion) {
      persistAnswer(currentQuestion.id);
    }

    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
    }
  }, [currentIndex, currentQuestion, persistAnswer]);

  const skip = useCallback(() => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      setIsComplete(true);
    }
  }, [currentIndex, questions.length]);

  const goToQuestion = useCallback(
    (index: number) => {
      if (index >= 0 && index < questions.length) {
        if (currentQuestion) {
          persistAnswer(currentQuestion.id);
        }

        setCurrentIndex(index);
        setIsComplete(false);
      }
    },
    [currentQuestion, persistAnswer, questions.length]
  );

  return {
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
    setIsComplete,
  };
}
