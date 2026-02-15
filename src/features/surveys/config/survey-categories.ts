import type { LookupItem } from '@/lib/common/types';

/** Available survey categories for classification. */
export const SURVEY_CATEGORIES: readonly LookupItem[] = [
  { value: 'productivity', labelKey: 'surveys.categories.productivity' },
  { value: 'health', labelKey: 'surveys.categories.health' },
  { value: 'finance', labelKey: 'surveys.categories.finance' },
  { value: 'education', labelKey: 'surveys.categories.education' },
  { value: 'developer-tools', labelKey: 'surveys.categories.developerTools' },
  { value: 'design', labelKey: 'surveys.categories.design' },
  { value: 'marketing', labelKey: 'surveys.categories.marketing' },
  { value: 'communication', labelKey: 'surveys.categories.communication' },
  { value: 'entertainment', labelKey: 'surveys.categories.entertainment' },
  { value: 'other', labelKey: 'surveys.categories.other' },
] as const;

export const SURVEY_CATEGORY_VALUES = SURVEY_CATEGORIES.map((c) => c.value);
