import type { LookupItem } from '@/lib/common/types';

/** Available survey categories for classification. "other" must stay last. */
export const SURVEY_CATEGORIES: readonly LookupItem[] = [
  { value: 'problem-validation', labelKey: 'surveys.categories.problemValidation' },
  { value: 'solution-validation', labelKey: 'surveys.categories.solutionValidation' },
  { value: 'market-demand', labelKey: 'surveys.categories.marketDemand' },
  { value: 'willingness-to-pay', labelKey: 'surveys.categories.willingnessToPay' },
  { value: 'target-audience', labelKey: 'surveys.categories.targetAudience' },
  { value: 'competitive-landscape', labelKey: 'surveys.categories.competitiveLandscape' },
  { value: 'user-habits', labelKey: 'surveys.categories.userHabits' },
  { value: 'satisfaction', labelKey: 'surveys.categories.satisfaction' },
  { value: 'other', labelKey: 'surveys.categories.other' },
] as const;

export const SURVEY_CATEGORY_VALUES = SURVEY_CATEGORIES.map((c) => c.value);

/** Sort category options alphabetically, keeping "other" last. */
export function sortCategoriesOtherLast<T extends { value: string; label: string }>(
  options: T[]
): T[] {
  return [...options].sort((a, b) => {
    if (a.value === 'other') {
      return 1;
    }

    if (b.value === 'other') {
      return -1;
    }

    return a.label.localeCompare(b.label);
  });
}
