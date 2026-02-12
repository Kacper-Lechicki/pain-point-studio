'use client';

import type { QuestionSchema } from '@/features/surveys/types';

import { MultipleChoiceEditor } from './multiple-choice-editor';
import { RatingScaleEditor } from './rating-scale-editor';
import { TextPreviewEditor } from './text-preview-editor';
import { YesNoEditor } from './yes-no-editor';

interface QuestionEditorProps {
  question: QuestionSchema;
}

export function QuestionEditor({ question }: QuestionEditorProps) {
  switch (question.type) {
    case 'open_text':
      return <TextPreviewEditor config={question.config} variant="long" />;
    case 'short_text':
      return <TextPreviewEditor config={question.config} variant="short" />;
    case 'multiple_choice':
      return <MultipleChoiceEditor question={question} />;
    case 'rating_scale':
      return <RatingScaleEditor config={question.config} />;
    case 'yes_no':
      return <YesNoEditor />;
  }
}
