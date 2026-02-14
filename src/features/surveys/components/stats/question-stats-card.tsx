'use client';

import { useMemo } from 'react';

import { useTranslations } from 'next-intl';

import { Badge } from '@/components/ui/badge';
import type {
  QuestionAnswerData,
  QuestionStats,
} from '@/features/surveys/actions/get-survey-stats';
import { QUESTION_TYPE_ICONS, QUESTION_TYPE_LABEL_KEYS } from '@/features/surveys/config';

import { ChoiceDistributionChart } from './answer-charts/choice-distribution-chart';
import { RatingDistributionChart } from './answer-charts/rating-distribution-chart';
import { TextAnswersList } from './answer-charts/text-answers-list';
import { YesNoChart } from './answer-charts/yes-no-chart';

interface QuestionStatsCardProps {
  question: QuestionStats;
  index: number;
  completedResponses: number;
}

function computeInsight(
  type: QuestionStats['type'],
  answers: QuestionAnswerData[],
  t: ReturnType<typeof useTranslations<'surveys.stats'>>
): string | null {
  if (answers.length === 0) {
    return null;
  }

  switch (type) {
    case 'multiple_choice': {
      const counts = new Map<string, number>();

      for (const a of answers) {
        const selected = (a.value.selected as string[]) ?? [];

        for (const option of selected) {
          counts.set(option, (counts.get(option) ?? 0) + 1);
        }
      }

      if (counts.size === 0) {
        return null;
      }

      let topOption = '';
      let topCount = 0;

      for (const [option, count] of counts) {
        if (count > topCount) {
          topCount = count;
          topOption = option;
        }
      }

      const total = Array.from(counts.values()).reduce((s, c) => s + c, 0);
      const pct = Math.round((topCount / total) * 100);

      return t('insightTopChoice', { option: topOption, pct });
    }

    case 'rating_scale': {
      let sum = 0;
      let count = 0;
      let maxRating = 0;

      for (const a of answers) {
        const rating = a.value.rating as number;

        if (typeof rating === 'number') {
          sum += rating;
          count++;

          if (rating > maxRating) {
            maxRating = rating;
          }
        }
      }

      if (count === 0) {
        return null;
      }

      const avg = (sum / count).toFixed(1);

      return t('insightAvgRating', { value: avg, max: maxRating });
    }

    case 'yes_no': {
      const yesCount = answers.filter((a) => a.value.answer === true).length;
      const noCount = answers.filter((a) => a.value.answer === false).length;
      const total = yesCount + noCount;

      if (total === 0) {
        return null;
      }

      const majorityYes = yesCount >= noCount;
      const pct = Math.round(((majorityYes ? yesCount : noCount) / total) * 100);

      return t('insightMajority', {
        label: majorityYes ? t('yesLabel') : t('noLabel'),
        pct,
      });
    }

    case 'open_text':
    case 'short_text': {
      const texts = answers
        .map((a) => (a.value.text as string) ?? '')
        .filter((txt) => txt.trim().length > 0);

      if (texts.length === 0) {
        return null;
      }

      const totalChars = texts.reduce((s, txt) => s + txt.length, 0);
      const avgChars = Math.round(totalChars / texts.length);

      return t('insightText', { count: texts.length, chars: avgChars });
    }

    default:
      return null;
  }
}

export const QuestionStatsCard = ({
  question,
  index,
  completedResponses,
}: QuestionStatsCardProps) => {
  const t = useTranslations('surveys.stats');
  const tTypes = useTranslations('surveys.builder.types');

  const TypeIcon = QUESTION_TYPE_ICONS[question.type];
  const typeLabelKey = QUESTION_TYPE_LABEL_KEYS[question.type];
  const typeLabel = tTypes(typeLabelKey.split('.').pop() as Parameters<typeof tTypes>[0]);
  const responseCount = question.answers.length;
  const showAnsweredOfTotal = completedResponses > 0 && responseCount < completedResponses;

  const insight = useMemo(
    () => computeInsight(question.type, question.answers, t),
    [question.type, question.answers, t]
  );

  const renderChart = () => {
    switch (question.type) {
      case 'open_text':
      case 'short_text':
        return <TextAnswersList answers={question.answers} />;
      case 'multiple_choice':
        return <ChoiceDistributionChart answers={question.answers} />;
      case 'rating_scale':
        return <RatingDistributionChart answers={question.answers} />;
      case 'yes_no':
        return <YesNoChart answers={question.answers} />;
      default:
        return null;
    }
  };

  return (
    <div className="bg-muted/30 rounded-lg px-4 py-3 sm:px-5 sm:py-4">
      <p className="text-foreground text-xs leading-snug font-medium sm:text-sm">
        <span className="text-muted-foreground tabular-nums">{index + 1}. </span>
        {question.text || '—'}
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
        <Badge variant="secondary" className="gap-1 px-1.5 py-0 text-[10px] font-normal">
          <TypeIcon className="size-3" aria-hidden />
          {typeLabel}
        </Badge>
        <span className="text-muted-foreground text-[11px]">
          {t('responsesCount', { count: responseCount })}
        </span>
        {showAnsweredOfTotal && (
          <span className="text-muted-foreground text-[11px]">
            · {t('ofRespondentsAnswered', { answered: responseCount, total: completedResponses })}
          </span>
        )}
      </div>
      <div className="mt-3">{renderChart()}</div>
      {insight && <p className="text-muted-foreground mt-2 text-xs">{insight}</p>}
    </div>
  );
};
