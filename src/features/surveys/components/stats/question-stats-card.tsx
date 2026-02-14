'use client';

import { useTranslations } from 'next-intl';

import { Badge } from '@/components/ui/badge';
import type { QuestionStats } from '@/features/surveys/actions/get-survey-stats';
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
    </div>
  );
};
