'use client';

import type { PublicSurveyQuestion } from '@/features/surveys/types';

import { MultipleChoiceQuestion } from './multiple-choice-question';
import { OpenTextQuestion } from './open-text-question';
import { RatingScaleQuestion } from './rating-scale-question';
import { ShortTextQuestion } from './short-text-question';
import { YesNoQuestion } from './yes-no-question';

interface QuestionRendererProps {
  question: PublicSurveyQuestion;
  value: Record<string, unknown>;
  onChange: (value: Record<string, unknown>) => void;
}

export const QuestionRenderer = ({ question, value, onChange }: QuestionRendererProps) => {
  switch (question.type) {
    case 'open_text':
      return (
        <OpenTextQuestion
          value={(value.text as string) ?? ''}
          config={question.config}
          onChange={onChange}
        />
      );
    case 'short_text':
      return (
        <ShortTextQuestion
          value={(value.text as string) ?? ''}
          config={question.config}
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
