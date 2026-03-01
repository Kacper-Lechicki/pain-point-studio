'use client';

import { useCallback } from 'react';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { useTranslations } from 'next-intl';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProjectInsightsTab } from '@/features/projects/components/project-insights-tab';
import { ProjectNotesTab } from '@/features/projects/components/project-notes-tab';
import { ProjectOverviewTab } from '@/features/projects/components/project-overview-tab';
import { ProjectSurveysTab } from '@/features/projects/components/project-surveys-tab';
import type {
  Project,
  ProjectInsight,
  ProjectNoteFolder,
  ProjectNoteMeta,
  ProjectOverviewStats,
} from '@/features/projects/types';
import type { UserSurvey } from '@/features/surveys/actions';
import { getCreateSurveyUrl } from '@/features/surveys/lib/survey-urls';

type TabValue = 'overview' | 'surveys' | 'insights' | 'notes';

const VALID_TABS: TabValue[] = ['overview', 'surveys', 'insights', 'notes'];

interface ProjectDetailTabsProps {
  project: Project;
  surveys: UserSurvey[];
  insights: ProjectInsight[];
  notesMeta: ProjectNoteMeta[];
  noteFolders: ProjectNoteFolder[];
  overviewStats: ProjectOverviewStats;
  onInsightCreated: (insight: ProjectInsight) => void;
  onInsightUpdated: (insight: ProjectInsight) => void;
  onInsightDeleted: (insightId: string) => void;
  onInsightsChanged: (insights: ProjectInsight[]) => void;
}

export function ProjectDetailTabs({
  project,
  surveys,
  insights,
  notesMeta,
  noteFolders,
  overviewStats,
  onInsightCreated,
  onInsightUpdated,
  onInsightDeleted,
  onInsightsChanged,
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

  const handleCreateSurvey = useCallback(() => {
    router.push(getCreateSurveyUrl(project.id));
  }, [router, project.id]);

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange}>
      <TabsList variant="line">
        <TabsTrigger value="overview">{t('projects.detail.tabs.overview')}</TabsTrigger>
        <TabsTrigger value="surveys">
          {t('projects.detail.tabs.research')}
          {surveys.length > 0 && (
            <>
              {' '}
              <span className="text-muted-foreground text-xs tabular-nums">({surveys.length})</span>
            </>
          )}
        </TabsTrigger>
        <TabsTrigger value="insights">
          {t('projects.detail.tabs.insights')}
          {insights.length > 0 && (
            <>
              {' '}
              <span className="text-muted-foreground text-xs tabular-nums">
                ({insights.length})
              </span>
            </>
          )}
        </TabsTrigger>
        <TabsTrigger value="notes">
          {t('projects.detail.tabs.notes')}
          {notesMeta.filter((n) => !n.deleted_at).length > 0 && (
            <>
              {' '}
              <span className="text-muted-foreground text-xs tabular-nums">
                ({notesMeta.filter((n) => !n.deleted_at).length})
              </span>
            </>
          )}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="pt-5">
        <ProjectOverviewTab
          project={project}
          surveys={surveys}
          insights={insights}
          overviewStats={overviewStats}
        />
      </TabsContent>

      <TabsContent value="surveys" className="pt-5">
        <ProjectSurveysTab
          project={project}
          surveys={surveys}
          onCreateSurvey={handleCreateSurvey}
        />
      </TabsContent>

      <TabsContent value="insights" className="pt-5">
        <ProjectInsightsTab
          projectId={project.id}
          insights={insights}
          onInsightCreated={onInsightCreated}
          onInsightUpdated={onInsightUpdated}
          onInsightDeleted={onInsightDeleted}
          onInsightsChanged={onInsightsChanged}
        />
      </TabsContent>

      <TabsContent value="notes" className="pt-5">
        <ProjectNotesTab project={project} initialNotes={notesMeta} initialFolders={noteFolders} />
      </TabsContent>
    </Tabs>
  );
}
