'use client';

import { useMemo } from 'react';

import { Lightbulb, Users } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Badge } from '@/components/ui/badge';
import type {
  QuestionAnswerData,
  QuestionStats,
} from '@/features/surveys/actions/get-survey-stats';
import { QUESTION_TYPE_ICONS, QUESTION_TYPE_LABEL_KEYS } from '@/features/surveys/config';

import { ChoiceDistributionChart } from './answer-charts/choice-distribution-chart';
import { RatingDistributionChart } from './answer-charts/rating-distribution-chart';
import { ShortTextChart } from './answer-charts/short-text-chart';
import { TextAnswersList } from './answer-charts/text-answers-list';
import { YesNoChart } from './answer-charts/yes-no-chart';

interface QuestionStatsCardProps {
  question: QuestionStats;
  index: number;
}

function computeInsight(
  type: QuestionStats['type'],
  answers: QuestionAnswerData[],
  config: Record<string, unknown>,
  t: ReturnType<typeof useTranslations>
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

        const other = a.value.other as string | undefined;

        if (other) {
          const otherKey = `${t('surveys.stats.otherLabel' as Parameters<typeof t>[0])}: ${other}`;
          counts.set(otherKey, (counts.get(otherKey) ?? 0) + 1);
        }
      }

      if (counts.size === 0) {
        return null;
      }

      let topCount = 0;

      for (const [, count] of counts) {
        if (count > topCount) {
          topCount = count;
        }
      }

      const topOptions = Array.from(counts.entries())
        .filter(([, count]) => count === topCount)
        .map(([option]) => option);

      const totalSelections = Array.from(counts.values()).reduce((s, c) => s + c, 0);
      const pct = Math.round((topCount / totalSelections) * 100);

      if (topOptions.length > 1) {
        return t(
          'surveys.stats.insightTiedChoices' as Parameters<typeof t>[0],
          { options: topOptions.join(', '), pct } as never
        );
      }

      return t(
        'surveys.stats.insightTopChoice' as Parameters<typeof t>[0],
        { option: topOptions[0], pct } as never
      );
    }

    case 'rating_scale': {
      let sum = 0;
      let count = 0;

      for (const a of answers) {
        const rating = a.value.rating as number;

        if (typeof rating === 'number') {
          sum += rating;
          count++;
        }
      }

      if (count === 0) {
        return null;
      }

      const avg = (sum / count).toFixed(1);
      const scaleMax = (config.max as number) ?? 5;

      return t(
        'surveys.stats.insightAvgRating' as Parameters<typeof t>[0],
        { value: avg, max: scaleMax } as never
      );
    }

    case 'yes_no': {
      const yesCount = answers.filter((a) => a.value.answer === true).length;
      const noCount = answers.filter((a) => a.value.answer === false).length;
      const total = yesCount + noCount;

      if (total === 0) {
        return null;
      }

      if (yesCount === noCount) {
        return t('surveys.stats.insightEqualSplit' as Parameters<typeof t>[0]);
      }

      const majorityYes = yesCount > noCount;
      const pct = Math.round(((majorityYes ? yesCount : noCount) / total) * 100);

      return t(
        'surveys.stats.insightMajority' as Parameters<typeof t>[0],
        {
          label: majorityYes ? t('surveys.stats.yesLabel') : t('surveys.stats.noLabel'),
          pct,
        } as never
      );
    }

    case 'open_text':
    case 'short_text':
      // Text types have their own built-in analytics (keyword cloud, length histogram)
      return null;

    default:
      return null;
  }
}

export const QuestionStatsCard = ({ question, index }: QuestionStatsCardProps) => {
  const t = useTranslations();

  const TypeIcon = QUESTION_TYPE_ICONS[question.type];
  const typeLabelKey = QUESTION_TYPE_LABEL_KEYS[question.type];
  const typeLabel = t(typeLabelKey as Parameters<typeof t>[0]);
  const responseCount = question.answers.length;

  const insight = useMemo(
    () => computeInsight(question.type, question.answers, question.config, t),
    [question.type, question.answers, question.config, t]
  );

  const renderChart = () => {
    switch (question.type) {
      case 'open_text':
        return <TextAnswersList answers={question.answers} questionText={question.text} />;
      case 'short_text':
        return <ShortTextChart answers={question.answers} questionText={question.text} />;
      case 'multiple_choice':
        return <ChoiceDistributionChart answers={question.answers} />;
      case 'rating_scale':
        return <RatingDistributionChart answers={question.answers} config={question.config} />;
      case 'yes_no':
        return <YesNoChart answers={question.answers} />;
      default:
        return null;
    }
  };

  return (
    <div className="border-border rounded-lg border border-dashed px-4 py-3 sm:px-5 sm:py-4">
      <p className="text-foreground text-xs leading-snug font-medium sm:text-sm">
        <span className="text-muted-foreground tabular-nums">{index + 1}. </span>
        {question.text || '—'}
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
        <Badge variant="secondary" className="gap-1 px-1.5 py-0 text-[10px] font-normal">
          <TypeIcon className="size-3" aria-hidden />
          {typeLabel}
        </Badge>
        <Badge variant="outline" className="gap-1 px-1.5 py-0 text-[10px] font-normal">
          <Users className="size-3" aria-hidden />
          {t('surveys.stats.responsesCount', { count: responseCount })}
        </Badge>
      </div>
      <div className="mt-3">{renderChart()}</div>
      {insight && (
        <div className="mt-3 flex items-start gap-2 rounded-md border border-dashed border-amber-500/40 px-3 py-2">
          <Lightbulb className="mt-0.5 size-3.5 shrink-0 text-amber-500" aria-hidden />
          <p className="text-muted-foreground text-xs leading-relaxed font-semibold">{insight}</p>
        </div>
      )}
    </div>
  );
};
