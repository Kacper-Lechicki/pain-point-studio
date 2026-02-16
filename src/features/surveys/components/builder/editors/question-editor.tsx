'use client';

import { MultipleChoiceEditor } from '@/features/surveys/components/builder/editors/multiple-choice-editor';
import { RatingScaleEditor } from '@/features/surveys/components/builder/editors/rating-scale-editor';
import { TextPreviewEditor } from '@/features/surveys/components/builder/editors/text-preview-editor';
import { YesNoEditor } from '@/features/surveys/components/builder/editors/yes-no-editor';
import type { QuestionSchema } from '@/features/surveys/types';

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
