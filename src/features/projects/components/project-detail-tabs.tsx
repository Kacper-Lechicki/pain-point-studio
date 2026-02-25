'use client';

import { useCallback } from 'react';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { useTranslations } from 'next-intl';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { ProjectDetail, ProjectSurvey } from '@/features/projects/actions/get-project';
import { ProjectInsightsTab } from '@/features/projects/components/project-insights-tab';
import { ProjectOverviewTab } from '@/features/projects/components/project-overview-tab';
import { ProjectSurveysTab } from '@/features/projects/components/project-surveys-tab';
import type { Finding, Project, ProjectInsight } from '@/features/projects/types';

type TabValue = 'overview' | 'surveys' | 'insights';

const VALID_TABS: TabValue[] = ['overview', 'surveys', 'insights'];

interface ProjectDetailTabsProps {
  project: Project;
  surveys: ProjectSurvey[];
  surveysByPhase: ProjectDetail['surveysByPhase'];
  findingsByPhase: Record<string, Finding[]>;
  allFindings: Finding[];
  insights: ProjectInsight[];
  scorecardInsights: ProjectInsight[];
  onInsightCreated: (insight: ProjectInsight) => void;
  onInsightUpdated: (insight: ProjectInsight) => void;
  onInsightDeleted: (insightId: string) => void;
}

export function ProjectDetailTabs({
  project,
  surveys,
  surveysByPhase,
  findingsByPhase,
  allFindings,
  insights,
  scorecardInsights,
  onInsightCreated,
  onInsightUpdated,
  onInsightDeleted,
}: ProjectDetailTabsProps) {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const rawTab = searchParams.get('tab');
  const activeTab: TabValue =
    rawTab && VALID_TABS.includes(rawTab as TabValue) ? (rawTab as TabValue) : 'overview';

  const handleTabChange = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());

      if (value === 'overview') {
        params.delete('tab');
      } else {
        params.set('tab', value);
      }

      const qs = params.toString();
      router.replace(`${pathname}${qs ? `?${qs}` : ''}`, { scroll: false });
    },
    [router, pathname, searchParams]
  );

  const totalInsightCount = allFindings.length + insights.length;

  const isIdeaValidation = project.context === 'idea_validation';

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange}>
      <TabsList variant="line">
        <TabsTrigger value="overview">{t('projects.detail.tabs.overview')}</TabsTrigger>
        <TabsTrigger value="surveys">
          {t('projects.detail.tabs.surveys')}
          {surveys.length > 0 && (
            <span className="text-muted-foreground ml-1 text-xs tabular-nums">
              ({surveys.length})
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger value="insights">
          {t('projects.detail.tabs.insights')}
          {totalInsightCount > 0 && (
            <span className="text-muted-foreground ml-1 text-xs tabular-nums">
              ({totalInsightCount})
            </span>
          )}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="overview">
        <ProjectOverviewTab
          project={project}
          surveys={surveys}
          surveysByPhase={surveysByPhase}
          scorecardInsights={scorecardInsights}
          isIdeaValidation={isIdeaValidation}
          onInsightCreated={onInsightCreated}
          onInsightUpdated={onInsightUpdated}
          onInsightDeleted={onInsightDeleted}
          onNavigateToSurveys={() => handleTabChange('surveys')}
        />
      </TabsContent>

      <TabsContent value="surveys">
        <ProjectSurveysTab project={project} surveys={surveys} surveysByPhase={surveysByPhase} />
      </TabsContent>

      <TabsContent value="insights">
        <ProjectInsightsTab
          projectId={project.id}
          findingsByPhase={findingsByPhase}
          insights={insights}
          isIdeaValidation={isIdeaValidation}
          onInsightCreated={onInsightCreated}
          onInsightUpdated={onInsightUpdated}
          onInsightDeleted={onInsightDeleted}
        />
      </TabsContent>
    </Tabs>
  );
}
