import { useCallback, useMemo } from 'react';

import type { UserSurvey } from '@/features/surveys/actions/get-user-surveys';
import {
  NO_PROJECT_FILTER_ID,
  type ProjectFilterOption,
  type SurveySortBy,
  type SurveyStatusFilter,
} from '@/features/surveys/components/dashboard/survey-list-toolbar';
import { deriveSurveyFlags } from '@/features/surveys/config/survey-status';
import { useSessionState } from '@/hooks/common/use-session-state';

// ── Module-level constants ──────────────────────────────────────────

const PRE_FILTER = (s: UserSurvey) => !deriveSurveyFlags(s.status).isArchived;
const PRE_FILTER_PROJECT = () => true;

interface UseSurveyListFiltersOptions {
  /** When true, archived surveys are included and project filter is hidden. */
  projectContext?: boolean;
}

export const SURVEY_LIST_COMPARATOR = (sortBy: SurveySortBy, sortDir: 'asc' | 'desc') => {
  const mul = sortDir === 'asc' ? 1 : -1;

  switch (sortBy) {
    case 'responses':
      return (a: UserSurvey, b: UserSurvey) => mul * (a.responseCount - b.responseCount);
    case 'lastResponse':
      return (a: UserSurvey, b: UserSurvey) => {
        const ta = a.lastResponseAt ? new Date(a.lastResponseAt).getTime() : 0;
        const tb = b.lastResponseAt ? new Date(b.lastResponseAt).getTime() : 0;

        return mul * (ta - tb) || a.title.localeCompare(b.title);
      };

    case 'activity':
      return (a: UserSurvey, b: UserSurvey) => {
        const sumA = a.recentActivity.reduce((s, n) => s + n, 0);
        const sumB = b.recentActivity.reduce((s, n) => s + n, 0);

        return mul * (sumA - sumB) || a.title.localeCompare(b.title);
      };

    default:
      return undefined;
  }
};

// ── Hook ────────────────────────────────────────────────────────────

export function useSurveyListFilters(surveys: UserSurvey[], options?: UseSurveyListFiltersOptions) {
  const isProjectCtx = options?.projectContext ?? false;

  const [statusFilter, setStatusFilter] = useSessionState<SurveyStatusFilter[]>(
    'surveyList:status',
    []
  );

  const [projectFilter, setProjectFilterRaw] = useSessionState<string[]>('surveyList:project', []);

  const basePreFilter = isProjectCtx ? PRE_FILTER_PROJECT : PRE_FILTER;

  const preFilter = useCallback(
    (s: UserSurvey) => {
      if (!basePreFilter(s)) {
        return false;
      }

      if (statusFilter.length > 0 && !statusFilter.includes(s.status as SurveyStatusFilter)) {
        return false;
      }

      if (!isProjectCtx && projectFilter.length > 0) {
        const hasNone = projectFilter.includes(NO_PROJECT_FILTER_ID);
        const projectIds = projectFilter.filter((id) => id !== NO_PROJECT_FILTER_ID);

        if (s.projectId === null) {
          return hasNone;
        }

        return projectIds.includes(s.projectId);
      }

      return true;
    },
    [statusFilter, projectFilter, basePreFilter, isProjectCtx]
  );

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = isProjectCtx
      ? { active: 0, draft: 0, completed: 0, cancelled: 0, archived: 0 }
      : { active: 0, draft: 0, completed: 0, cancelled: 0 };

    for (const s of surveys) {
      if (!isProjectCtx && deriveSurveyFlags(s.status).isArchived) {
        continue;
      }

      if (s.status in counts) {
        const current = counts[s.status];

        if (current !== undefined) {
          counts[s.status] = current + 1;
        }
      }
    }

    return counts;
  }, [surveys, isProjectCtx]);

  const projectOptions = useMemo(() => {
    if (isProjectCtx) {
      return [];
    }

    const map = new Map<string, { name: string; count: number }>();
    let noProjectCount = 0;

    for (const s of surveys) {
      if (deriveSurveyFlags(s.status).isArchived) {
        continue;
      }

      if (statusFilter.length > 0 && !statusFilter.includes(s.status as SurveyStatusFilter)) {
        continue;
      }

      if (s.projectId && s.projectName) {
        const entry = map.get(s.projectId);

        if (entry) {
          entry.count++;
        } else {
          map.set(s.projectId, { name: s.projectName, count: 1 });
        }
      } else {
        noProjectCount++;
      }
    }

    const options: ProjectFilterOption[] = [];

    for (const [id, { name, count }] of map) {
      options.push({ id, name, count });
    }

    if (noProjectCount > 0) {
      options.push({ id: NO_PROJECT_FILTER_ID, name: '', count: noProjectCount });
    }

    return options;
  }, [surveys, statusFilter, isProjectCtx]);

  const setProjectFilter = useCallback(
    (ids: string[]) => {
      setProjectFilterRaw(ids);
    },
    [setProjectFilterRaw]
  );

  const kpiStatuses = useMemo(() => {
    const order: SurveyStatusFilter[] = isProjectCtx
      ? ['active', 'draft', 'completed', 'cancelled', 'archived']
      : ['active', 'draft', 'completed', 'cancelled'];

    return order.filter((s) => (statusCounts[s] ?? 0) > 0);
  }, [statusCounts, isProjectCtx]);

  const isFiltered = statusFilter.length > 0 || (!isProjectCtx && projectFilter.length > 0);

  return {
    statusFilter,
    setStatusFilter,
    projectFilter,
    setProjectFilter,
    preFilter,
    statusCounts,
    projectOptions,
    kpiStatuses,
    isFiltered,
  };
}
