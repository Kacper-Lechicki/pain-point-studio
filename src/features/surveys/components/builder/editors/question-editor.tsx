'use client';

import type { QuestionState } from '@/features/surveys/types';

import { MultipleChoiceEditor } from './multiple-choice-editor';
import { OpenTextEditor } from './open-text-editor';
import { RatingScaleEditor } from './rating-scale-editor';
import { ShortTextEditor } from './short-text-editor';
import { YesNoEditor } from './yes-no-editor';

interface QuestionEditorProps {
  question: QuestionState;
}

export function QuestionEditor({ question }: QuestionEditorProps) {
  switch (question.type) {
    case 'open_text':
      return <OpenTextEditor config={question.config} />;
    case 'short_text':
      return <ShortTextEditor config={question.config} />;
    case 'multiple_choice':
      return <MultipleChoiceEditor question={question} />;
    case 'rating_scale':
      return <RatingScaleEditor config={question.config} />;
    case 'yes_no':
      return <YesNoEditor />;
  }
}
