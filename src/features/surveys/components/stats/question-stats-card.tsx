'use client';

import { useTranslations } from 'next-intl';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { QuestionStats } from '@/features/surveys/actions/get-survey-stats';

import { ChoiceDistributionChart } from './answer-charts/choice-distribution-chart';
import { RatingDistributionChart } from './answer-charts/rating-distribution-chart';
import { TextAnswersList } from './answer-charts/text-answers-list';
import { YesNoChart } from './answer-charts/yes-no-chart';

interface QuestionStatsCardProps {
  question: QuestionStats;
  index: number;
}

export const QuestionStatsCard = ({ question, index }: QuestionStatsCardProps) => {
  const t = useTranslations('surveys.stats');

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
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">
          <span className="text-muted-foreground mr-2">Q{index + 1}.</span>
          {question.text}
        </CardTitle>
        <p className="text-muted-foreground text-xs">
          {question.answers.length} {t('responses')}
        </p>
      </CardHeader>
      <CardContent>{renderChart()}</CardContent>
    </Card>
  );
};
