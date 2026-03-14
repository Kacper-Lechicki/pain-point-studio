'use client';

import { useTranslations } from 'next-intl';

import { InlineTextSearch } from '@/features/surveys/components/stats/answer-charts/inline-text-search';
import type { ResponseItem } from '@/features/surveys/components/stats/answer-charts/inline-text-search';
import type { QuestionAnswerData } from '@/features/surveys/types';

interface ShortTextChartProps {
  answers: QuestionAnswerData[];
}

export const ShortTextChart = ({ answers }: ShortTextChartProps) => {
  const t = useTranslations('surveys.stats');

  const textAnswers: ResponseItem[] = answers
    .map((a) => ({
      text: (a.value.text as string) ?? '',
      completedAt: a.completedAt,
    }))
    .filter((item) => item.text.trim().length > 0);

  if (textAnswers.length === 0) {
    return <p className="text-muted-foreground text-xs">{t('noTextResponses')}</p>;
  }

  return <InlineTextSearch responses={textAnswers} />;
};
