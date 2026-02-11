import { AlignLeft, ListChecks, Star, ToggleLeft, Type } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import type { QuestionType } from '@/features/surveys/types';

export const QUESTION_TYPE_ICONS: Record<QuestionType, LucideIcon> = {
  open_text: AlignLeft,
  short_text: Type,
  multiple_choice: ListChecks,
  rating_scale: Star,
  yes_no: ToggleLeft,
};

export const QUESTION_TYPE_LABEL_KEYS: Record<QuestionType, string> = {
  open_text: 'surveys.builder.types.openText',
  short_text: 'surveys.builder.types.shortText',
  multiple_choice: 'surveys.builder.types.multipleChoice',
  rating_scale: 'surveys.builder.types.ratingScale',
  yes_no: 'surveys.builder.types.yesNo',
};
