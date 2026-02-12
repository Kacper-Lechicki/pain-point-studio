'use client';

import { useMemo, useState } from 'react';

import { Search } from 'lucide-react';
import { useTranslations } from 'next-intl';

import type { UserSurvey } from '@/features/surveys/actions/get-user-surveys';
import type { SurveyStatus } from '@/features/surveys/types';

import { SurveyCard } from './survey-card';
import {
  SurveyListToolbar,
  type SurveySortBy,
  type SurveyStatusFilter,
} from './survey-list-toolbar';

/** Maps an action to the resulting survey status (or null for deletion). */
const STATUS_TRANSITIONS: Record<string, SurveyStatus | null> = {
  close: 'closed',
  reopen: 'active',
  archive: 'archived',
  delete: null,
} as const;

interface SurveyListProps {
  initialSurveys: UserSurvey[];
  initialStatusFilter?: SurveyStatusFilter;
}

export const SurveyList = ({ initialSurveys, initialStatusFilter = 'all' }: SurveyListProps) => {
  const t = useTranslations('surveys.dashboard');
  const [surveys, setSurveys] = useState(initialSurveys);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SurveySortBy>('updated');

  const filteredSurveys = useMemo(() => {
    let result = surveys;

    // Status filter ("all" shows everything except archived)
    if (initialStatusFilter === 'all') {
      result = result.filter((s) => s.status !== 'archived');
    } else {
      result = result.filter((s) => s.status === initialStatusFilter);
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (s) => s.title.toLowerCase().includes(q) || s.description.toLowerCase().includes(q)
      );
    }

    // Sort
    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case 'updated':
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        case 'created':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'responses':
          return b.responseCount - a.responseCount;
        case 'title':
          return a.title.localeCompare(b.title);
      }
    });

    return result;
  }, [surveys, initialStatusFilter, searchQuery, sortBy]);

  const handleStatusChange = (surveyId: string, action: string) => {
    const newStatus = STATUS_TRANSITIONS[action] as SurveyStatus | null | undefined;

    if (newStatus === undefined) {
      return;
    }

    setSurveys((prev) => {
      if (newStatus === null) {
        return prev.filter((s) => s.id !== surveyId);
      }

      return prev.map((s) =>
        s.id === surveyId ? { ...s, status: newStatus, updatedAt: new Date().toISOString() } : s
      );
    });
  };

  return (
    <div className="space-y-4">
      <SurveyListToolbar
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        sortBy={sortBy}
        onSortByChange={setSortBy}
      />

      {filteredSurveys.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Search className="text-muted-foreground mb-3 size-8 opacity-50" />
          <p className="text-muted-foreground text-sm">
            {searchQuery.trim()
              ? t('noSearchResults', { query: searchQuery })
              : t('noMatchingSurveys')}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredSurveys.map((survey) => (
            <SurveyCard key={survey.id} survey={survey} onStatusChange={handleStatusChange} />
          ))}
        </div>
      )}
    </div>
  );
};
