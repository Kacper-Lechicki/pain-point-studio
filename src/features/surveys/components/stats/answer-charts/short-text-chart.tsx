'use client';

import { useMemo } from 'react';

import { useTranslations } from 'next-intl';

import type { QuestionAnswerData } from '@/features/surveys/actions/get-survey-stats';
import { InlineTextSearch } from '@/features/surveys/components/stats/answer-charts/inline-text-search';
import type { ResponseItem } from '@/features/surveys/components/stats/answer-charts/inline-text-search';

interface ShortTextChartProps {
  answers: QuestionAnswerData[];
  questionText: string;
}

export const ShortTextChart = ({ answers, questionText }: ShortTextChartProps) => {
  const t = useTranslations();

  const textAnswers = useMemo<ResponseItem[]>(
    () =>
      answers
        .map((a) => ({
          text: (a.value.text as string) ?? '',
          completedAt: a.completedAt,
        }))
        .filter((item) => item.text.trim().length > 0),
    [answers]
  );

  if (textAnswers.length === 0) {
    return <p className="text-muted-foreground text-xs">{t('surveys.stats.noTextResponses')}</p>;
  }

  return <InlineTextSearch responses={textAnswers} questionText={questionText} />;
};
