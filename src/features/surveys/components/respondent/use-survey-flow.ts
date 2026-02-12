'use client';

import { useCallback, useRef, useState, useTransition } from 'react';

import { saveAnswer } from '@/features/surveys/actions/respondent';
import type { PublicSurveyQuestion } from '@/features/surveys/types';

type AnswerMap = Map<string, Record<string, unknown>>;

interface UseSurveyFlowProps {
  questions: PublicSurveyQuestion[];
  responseId: string;
}

function isAnswerEmpty(value: Record<string, unknown>): boolean {
  if ('text' in value) {
    return !(value.text as string)?.trim();
  }

  if ('selected' in value) {
    return ((value.selected as string[]) ?? []).length === 0;
  }

  if ('rating' in value) {
    return value.rating === null || value.rating === undefined;
  }

  if ('answer' in value) {
    return value.answer === null || value.answer === undefined;
  }

  return true;
}

export function useSurveyFlow({ questions, responseId }: UseSurveyFlowProps) {
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
        await saveAnswer({ responseId, questionId, value });
      });
    },
    [answers, responseId]
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
