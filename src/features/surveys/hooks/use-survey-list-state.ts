import { useMemo, useState } from 'react';

import { useNow } from 'next-intl';

import type { UserSurvey } from '@/features/surveys/actions/get-user-surveys';
import { NOW_UPDATE_INTERVAL_MS } from '@/features/surveys/config';
import { getDefaultSortDir, getSurveyComparator } from '@/features/surveys/lib/sort-helpers';
import { useBreakpoint } from '@/hooks/common/use-breakpoint';

type SortDir = 'asc' | 'desc';

interface UseSurveyListStateOptions<TSortKey extends string> {
  surveys: UserSurvey[];
  defaultSortBy: TSortKey;
  defaultSortDir?: SortDir;
  /** Pre-filters surveys before search/sort (e.g. exclude archived). */
  preFilter?: (survey: UserSurvey) => boolean;
  /** List-specific comparator for sort keys not handled by `getSurveyComparator`. */
  customComparator?: (
    sortBy: TSortKey,
    sortDir: SortDir
  ) => ((a: UserSurvey, b: UserSurvey) => number) | undefined;
}

export function useSurveyListState<TSortKey extends string>({
  surveys,
  defaultSortBy,
  defaultSortDir,
  preFilter,
  customComparator,
}: UseSurveyListStateOptions<TSortKey>) {
  const now = useNow({ updateInterval: NOW_UPDATE_INTERVAL_MS });
  const isMd = useBreakpoint('md');

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<TSortKey>(defaultSortBy);
  const [sortDir, setSortDir] = useState<SortDir>(
    defaultSortDir ?? getDefaultSortDir(defaultSortBy)
  );

  const handleSortByChange = (key: TSortKey) => {
    setSortBy(key);
    setSortDir(getDefaultSortDir(key));
  };

  const handleSortByColumn = (key: TSortKey) => {
    if (sortBy === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      handleSortByChange(key);
    }
  };

  const filteredSurveys = useMemo(() => {
    let result = preFilter ? surveys.filter(preFilter) : surveys;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (s) => s.title.toLowerCase().includes(q) || s.description.toLowerCase().includes(q)
      );
    }

    const common = getSurveyComparator(sortBy, sortDir);

    if (common) {
      return [...result].sort(common);
    }

    const custom = customComparator?.(sortBy, sortDir);

    if (custom) {
      return [...result].sort(custom);
    }

    return result;
  }, [surveys, searchQuery, sortBy, sortDir, preFilter, customComparator]);

  return {
    now,
    isMd,
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    sortDir,
    setSortDir,
    handleSortByChange,
    handleSortByColumn,
    filteredSurveys,
  };
}
