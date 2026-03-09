import { BarChart3 } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { EmptyState } from '@/components/ui/empty-state';
import type { QuestionStats } from '@/features/surveys/actions/get-survey-stats';
import { QuestionStatsCard } from '@/features/surveys/components/stats/question-stats-card';

interface QuestionsTabProps {
  questions: QuestionStats[];
  hasResponses: boolean;
}

export function QuestionsTab({ questions }: QuestionsTabProps) {
  const t = useTranslations('surveys.stats');

  if (questions.length === 0) {
    return (
      <EmptyState
        icon={BarChart3}
        title={t('questionsEmpty.title')}
        description={t('questionsEmpty.description')}
        accent="violet"
        variant="card"
      />
    );
  }

  return (
    <div className="space-y-3">
      {questions.map((q, i) => (
        <QuestionStatsCard key={q.id} question={q} index={i} />
      ))}
    </div>
  );
}
