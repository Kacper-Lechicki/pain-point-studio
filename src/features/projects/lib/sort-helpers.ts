import type { ProjectWithMetrics } from '@/features/projects/actions/get-projects';
import type { ProjectSortBy } from '@/features/projects/components/project-list-toolbar';

const ASC_KEYS: readonly string[] = ['name', 'status', 'context'];

export function getDefaultSortDir(key: string): 'asc' | 'desc' {
  return ASC_KEYS.includes(key) ? 'asc' : 'desc';
}

export function getProjectComparator(
  sortBy: ProjectSortBy,
  sortDir: 'asc' | 'desc'
): (a: ProjectWithMetrics, b: ProjectWithMetrics) => number {
  const mul = sortDir === 'asc' ? 1 : -1;

  switch (sortBy) {
    case 'name':
      return (a, b) => mul * a.name.localeCompare(b.name);
    case 'status':
      return (a, b) => mul * a.status.localeCompare(b.status) || a.name.localeCompare(b.name);
    case 'context':
      return (a, b) => mul * a.context.localeCompare(b.context) || a.name.localeCompare(b.name);
    case 'surveys':
      return (a, b) => mul * (a.surveyCount - b.surveyCount) || a.name.localeCompare(b.name);
    case 'responses':
      return (a, b) => mul * (a.responseCount - b.responseCount) || a.name.localeCompare(b.name);
    case 'progress':
      return (a, b) => {
        const pa = a.validationProgress ?? -1;
        const pb = b.validationProgress ?? -1;

        return mul * (pa - pb) || a.name.localeCompare(b.name);
      };

    case 'created':
      return (a, b) => mul * (new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    case 'updated':
    default:
      return (a, b) => mul * (new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime());
  }
}
