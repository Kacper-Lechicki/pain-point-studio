'use client';

import type { QuestionAnswerData } from '@/features/surveys/actions/get-survey-stats';

interface TextAnswersListProps {
  answers: QuestionAnswerData[];
}

export const TextAnswersList = ({ answers }: TextAnswersListProps) => {
  const textAnswers = answers
    .map((a) => (a.value.text as string) ?? '')
    .filter((t) => t.trim().length > 0);

  if (textAnswers.length === 0) {
    return <p className="text-muted-foreground text-sm">No text responses yet.</p>;
  }

  return (
    <div className="max-h-64 space-y-2 overflow-y-auto">
      {textAnswers.map((text, i) => (
        <div key={i} className="bg-muted rounded-md px-3 py-2 text-sm">
          {text}
        </div>
      ))}
    </div>
  );
};
