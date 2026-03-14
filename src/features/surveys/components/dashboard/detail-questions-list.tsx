'use client';

import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { SectionLabel } from '@/components/ui/metric-display';
import { QuestionConfigDetails } from '@/features/surveys/components/dashboard/question-config-details';
import { QUESTION_TYPE_ICONS, QUESTION_TYPE_LABEL_KEYS } from '@/features/surveys/config';
import type { MappedQuestion } from '@/features/surveys/lib/map-question-row';

interface DetailQuestionsListProps {
  questions: MappedQuestion[] | null;
}

export function DetailQuestionsList({ questions }: DetailQuestionsListProps) {
  const t = useTranslations();

  if (questions != null && questions.length === 0) {
    return null;
  }

  return (
    <>
      <SectionLabel>
        {t('surveys.dashboard.detailPanel.questionsLabel')}
        {questions != null && questions.length > 0 && (
          <span className="ml-1 tabular-nums">({questions.length})</span>
        )}
      </SectionLabel>

      {questions === null ? (
        <div className="text-muted-foreground flex items-center gap-2 py-2 text-xs">
          <Loader2 className="size-3.5 animate-spin" aria-hidden />
          {t('surveys.dashboard.detailPanel.loadingQuestions')}
        </div>
      ) : (
        <div className="space-y-1.5">
          {questions.map((q: MappedQuestion, i: number) => {
            const TypeIcon = QUESTION_TYPE_ICONS[q.type];
            const labelKey = QUESTION_TYPE_LABEL_KEYS[q.type];
            const typeLabel = t(labelKey as Parameters<typeof t>[0]);

            return (
              <div
                key={q.id}
                className="border-border/50 rounded-md border border-dashed px-3 py-2.5"
              >
                <p className="text-foreground text-xs leading-snug font-medium">
                  <span className="text-muted-foreground tabular-nums">{i + 1}. </span>
                  {q.text || '—'}
                </p>

                <div className="mt-1.5">
                  <span className="bg-secondary text-secondary-foreground inline-flex items-center gap-1 rounded-md border px-1.5 py-0 text-[10px] font-normal">
                    <TypeIcon className="size-3" aria-hidden />
                    {typeLabel}
                  </span>

                  <QuestionConfigDetails question={q} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
