'use client';

import { useMemo } from 'react';

import { Lightbulb, Users } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Badge } from '@/components/ui/badge';
import type { QuestionStats } from '@/features/surveys/actions/get-survey-stats';
import { ChoiceDistributionChart } from '@/features/surveys/components/stats/answer-charts/choice-distribution-chart';
import { RatingDistributionChart } from '@/features/surveys/components/stats/answer-charts/rating-distribution-chart';
import { ShortTextChart } from '@/features/surveys/components/stats/answer-charts/short-text-chart';
import { TextAnswersList } from '@/features/surveys/components/stats/answer-charts/text-answers-list';
import { YesNoChart } from '@/features/surveys/components/stats/answer-charts/yes-no-chart';
import { QUESTION_TYPE_ICONS, QUESTION_TYPE_LABEL_KEYS } from '@/features/surveys/config';
import { computeInsight } from '@/features/surveys/lib/compute-insight';

interface QuestionStatsCardProps {
  question: QuestionStats;
  index: number;
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
