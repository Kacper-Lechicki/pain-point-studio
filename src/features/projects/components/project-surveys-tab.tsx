'use client';

import { useMemo, useState } from 'react';

import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { HeroHighlight } from '@/components/ui/hero-highlight';
import { SearchInput } from '@/components/ui/search-input';
import { ROUTES } from '@/config/routes';
import type { ProjectSurvey } from '@/features/projects/actions/get-project';
import { PhaseSection } from '@/features/projects/components/phase-section';
import { isProjectArchived } from '@/features/projects/lib/project-helpers';
import type { Project } from '@/features/projects/types';
import Link from '@/i18n/link';

interface ProjectSurveysTabProps {
  project: Project;
  surveys: ProjectSurvey[];
}

export function ProjectSurveysTab({ project, surveys }: ProjectSurveysTabProps) {
  const t = useTranslations();
  const [searchQuery, setSearchQuery] = useState('');
  const isArchived = isProjectArchived(project);

  const isSearching = searchQuery.trim().length > 0;

  const filteredSurveys = useMemo(() => {
    if (!isSearching) {
      return surveys;
    }

    const q = searchQuery.trim().toLowerCase();

    return surveys.filter((s) => s.title.toLowerCase().includes(q));
  }, [surveys, searchQuery, isSearching]);

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
      <div className="flex flex-wrap items-center gap-2">
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder={t('projects.detail.searchPlaceholder')}
          className="basis-full sm:max-w-sm sm:flex-1 sm:basis-auto"
        />
      </div>

      <div className="flex flex-col gap-8">
        <PhaseSection
          phase={null}
          surveys={filteredSurveys}
          projectId={project.id}
          totalCount={surveys.length}
          isSearching={isSearching}
          sectionTitle={t('projects.detail.allSurveys')}
        />
      </div>
    </div>
  );
}
