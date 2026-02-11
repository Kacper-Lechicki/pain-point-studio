'use client';

import { useMemo, useState, useTransition } from 'react';

import { Search } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { getUserSurveys } from '@/features/surveys/actions';
import type { UserSurvey } from '@/features/surveys/actions/get-user-surveys';

import { SurveyCard } from './survey-card';
import {
  SurveyListToolbar,
  type SurveySortBy,
  type SurveyStatusFilter,
} from './survey-list-toolbar';

interface SurveyListProps {
  initialSurveys: UserSurvey[];
}

export const SurveyList = ({ initialSurveys }: SurveyListProps) => {
  const t = useTranslations('surveys.dashboard');
  const [surveys, setSurveys] = useState(initialSurveys);
  const [statusFilter, setStatusFilter] = useState<SurveyStatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SurveySortBy>('updated');
  const [, startTransition] = useTransition();

  const filteredSurveys = useMemo(() => {
    let result = surveys;

    // Status filter ("all" shows everything except archived)
    if (statusFilter === 'all') {
      result = result.filter((s) => s.status !== 'archived');
    } else {
      result = result.filter((s) => s.status === statusFilter);
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
  }, [surveys, statusFilter, searchQuery, sortBy]);

  const handleRefresh = () => {
    startTransition(async () => {
      const updated = await getUserSurveys();

      if (updated) {
        setSurveys(updated);
      }
    });
  };

  return (
    <div className="space-y-4">
      <SurveyListToolbar
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
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
        <div className="space-y-2">
          {filteredSurveys.map((survey) => (
            <SurveyCard key={survey.id} survey={survey} onStatusChange={handleRefresh} />
          ))}
        </div>
      )}
    </div>
  );
};
