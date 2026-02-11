import type { QuestionType } from '@/features/surveys/types';

export function getDefaultConfig(type: QuestionType): Record<string, unknown> {
  switch (type) {
    case 'multiple_choice':
      return { options: ['', ''], allowOther: false };
    case 'rating_scale':
      return { min: 1, max: 5, minLabel: '', maxLabel: '' };
    case 'open_text':
      return {};
    case 'short_text':
      return {};
    case 'yes_no':
      return {};
  }
}
