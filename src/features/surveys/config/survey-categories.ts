import type { LookupItem } from '@/lib/common/types';

/** Available survey categories for classification. */
export const SURVEY_CATEGORIES: readonly LookupItem[] = [
  {
    value: 'project-idea-evaluation',
    labelKey: 'surveys.categories.projectIdeaEvaluation',
  },
] as const;

export const SURVEY_CATEGORY_VALUES = SURVEY_CATEGORIES.map((c) => c.value);
