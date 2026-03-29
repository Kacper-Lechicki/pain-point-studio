import type { UserSurvey } from '@/features/surveys/types';

const ASC_KEYS: readonly string[] = ['title', 'status'];

export function getDefaultSortDir(key: string): 'asc' | 'desc' {
  return ASC_KEYS.includes(key) ? 'asc' : 'desc';
}

/**
 * Returns a comparator for common survey sort keys, or `undefined` for
 * list-specific keys (lastResponse, activity, etc.)
 */
export function getSurveyComparator(
  key: string,
  dir: 'asc' | 'desc'
): ((a: UserSurvey, b: UserSurvey) => number) | undefined {
  const mul = dir === 'asc' ? 1 : -1;

  switch (key) {
    case 'updated':
      return (a, b) => mul * (new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime());

    case 'created':
      return (a, b) => mul * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    case 'title':
      return (a, b) => mul * a.title.localeCompare(b.title);

    case 'status':
      return (a, b) => mul * (a.status.localeCompare(b.status) || a.title.localeCompare(b.title));

    case 'questions':
      return (a, b) =>
        mul * (a.questionCount - b.questionCount) ||
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();

    case 'completion':
      return (a, b) => {
        const aVal = a.avgQuestionCompletion ?? -1;
        const bVal = b.avgQuestionCompletion ?? -1;

        return (
          mul * (aVal - bVal) || new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
      };

    default:
      return undefined;
  }
}
