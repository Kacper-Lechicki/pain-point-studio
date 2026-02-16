'use client';

import { MultipleChoiceQuestion } from '@/features/surveys/components/respondent/question-renderers/multiple-choice-question';
import { RatingScaleQuestion } from '@/features/surveys/components/respondent/question-renderers/rating-scale-question';
import { TextQuestion } from '@/features/surveys/components/respondent/question-renderers/text-question';
import { YesNoQuestion } from '@/features/surveys/components/respondent/question-renderers/yes-no-question';
import type { PublicSurveyQuestion } from '@/features/surveys/types';

interface QuestionRendererProps {
  question: PublicSurveyQuestion;
  value: Record<string, unknown>;
  onChange: (value: Record<string, unknown>) => void;
}

export const QuestionRenderer = ({ question, value, onChange }: QuestionRendererProps) => {
  switch (question.type) {
    case 'open_text':
    case 'short_text':
      return (
        <TextQuestion
          value={(value.text as string) ?? ''}
          config={question.config}
          variant={question.type === 'open_text' ? 'long' : 'short'}
          onChange={onChange}
        />
      );
    case 'multiple_choice':
      return (
        <MultipleChoiceQuestion
          value={{
            selected: (value.selected as string[]) ?? [],
            other: (value.other as string) ?? null,
          }}
          config={question.config}
          onChange={onChange}
        />
      );
    case 'rating_scale':
      return (
        <RatingScaleQuestion
          value={(value.rating as number) ?? null}
          config={question.config}
          onChange={onChange}
        />
      );
    case 'yes_no':
      return (
        <YesNoQuestion
          value={typeof value.answer === 'boolean' ? value.answer : null}
          onChange={onChange}
        />
      );
    default:
      return null;
  }
};
