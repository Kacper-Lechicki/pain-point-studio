'use client';

import { useMemo, useState } from 'react';

import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { HeroHighlight } from '@/components/ui/hero-highlight';
import { ROUTES } from '@/config/routes';
import type { ProjectSurvey } from '@/features/projects/actions/get-project';
import { SurveyDataTable } from '@/features/projects/components/survey-data-table';
import { SurveyKpiBar } from '@/features/projects/components/survey-kpi-bar';
import {
  type SortKey,
  SurveyTableToolbar,
} from '@/features/projects/components/survey-table-toolbar';
import { isProjectArchived } from '@/features/projects/lib/project-helpers';
import type { Project } from '@/features/projects/types';
import type { SurveyStatus } from '@/features/surveys/types';
import Link from '@/i18n/link';

interface ProjectSurveysTabProps {
  project: Project;
  surveys: ProjectSurvey[];
}

// ── Sort helpers ────────────────────────────────────────────────────

function sortSurveys(surveys: ProjectSurvey[], key: SortKey): ProjectSurvey[] {
  const sorted = [...surveys];

  switch (key) {
    case 'newest':
      return sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    case 'oldest':
      return sorted.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    case 'mostResponses':
      return sorted.sort((a, b) => b.responseCount - a.responseCount);
    case 'titleAz':
      return sorted.sort((a, b) => a.title.localeCompare(b.title));
    default:
      return sorted;
  }
}

export function ProjectSurveysTab({ project, surveys }: ProjectSurveysTabProps) {
  const t = useTranslations();
  const isArchived = isProjectArchived(project);

  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortKey>('newest');
  const [statusFilter, setStatusFilter] = useState<SurveyStatus | null>(null);

  const filteredAndSorted = useMemo(() => {
    let result = surveys;

    // Status filter
    if (statusFilter) {
      result = result.filter((s) => s.status === statusFilter);
    }

    // Search filter
    const q = search.trim().toLowerCase();

    if (q) {
      result = result.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          (s.description && s.description.toLowerCase().includes(q))
      );
    }

    // Sort
    return sortSurveys(result, sort);
  }, [surveys, statusFilter, search, sort]);

  const handleStatusChange = () => {
    // The page will revalidate via Next.js server action revalidation.
    // No local state update needed since surveys come from server props.
  };

  // Empty state — no surveys at all
  if (surveys.length === 0) {
    return (
      <HeroHighlight
        showDotsOnMobile={false}
        containerClassName="w-full rounded-lg border border-dashed border-border"
      >
        <div className="flex w-full flex-col items-center px-4 py-12 text-center md:py-16">
          <p className="text-foreground text-base font-medium">
            {t('projects.detail.empty.noSurveys')}
          </p>
          <p className="text-muted-foreground mt-1 max-w-sm text-sm">
            {t('projects.detail.empty.noSurveysDescription')}
          </p>
          {!isArchived && (
            <Button className="mt-4" asChild>
              <Link href={`${ROUTES.dashboard.researchNew}?projectId=${project.id}`}>
                <Plus className="size-4" aria-hidden />
                {t('projects.detail.createSurvey')}
              </Link>
            </Button>
          )}
        </div>
      </HeroHighlight>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <SurveyKpiBar surveys={surveys} />

      <SurveyTableToolbar
        projectId={project.id}
        isArchived={isArchived}
        search={search}
        onSearchChange={setSearch}
        sort={sort}
        onSortChange={setSort}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
      />

      <SurveyDataTable surveys={filteredAndSorted} onStatusChange={handleStatusChange} />
    </div>
  );
}
