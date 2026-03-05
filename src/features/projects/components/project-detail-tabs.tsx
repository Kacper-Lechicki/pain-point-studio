'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { useTranslations } from 'next-intl';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { SurveySignalData } from '@/features/projects/actions/get-project-signals-data';
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
  signalsData: SurveySignalData[];
  onInsightCreated: (insight: ProjectInsight) => void;
  onInsightUpdated: (insight: ProjectInsight) => void;
  onInsightDeleted: (insightId: string) => void;
  onInsightsChanged: (insights: ProjectInsight[]) => void;
}

function TabCount({ count }: { count: number }) {
  if (count === 0) {
    return null;
  }

  return (
    <>
      {' '}
      <span className="text-muted-foreground text-xs tabular-nums">({count})</span>
    </>
  );
}

export function ProjectDetailTabs({
  project,
  surveys,
  insights,
  notesMeta,
  noteFolders,
  overviewStats,
  signalsData,
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

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (value === 'overview') {
      params.delete('tab');
    } else {
      params.set('tab', value);
    }

    const qs = params.toString();
    router.replace(`${pathname}${qs ? `?${qs}` : ''}`, { scroll: false });
  };

  const handleCreateSurvey = () => {
    router.push(getCreateSurveyUrl(project.id));
  };

  const activeNotesCount = notesMeta.filter((n) => !n.deleted_at).length;

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange}>
      <TabsList variant="line">
        <TabsTrigger value="overview">{t('projects.detail.tabs.overview')}</TabsTrigger>
        <TabsTrigger value="surveys">
          {t('projects.detail.tabs.research')}
          <TabCount count={surveys.length} />
        </TabsTrigger>
        <TabsTrigger value="insights">
          {t('projects.detail.tabs.insights')}
          <TabCount count={insights.length} />
        </TabsTrigger>
        <TabsTrigger value="notes">
          {t('projects.detail.tabs.notes')}
          <TabCount count={activeNotesCount} />
        </TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="pt-5">
        <ProjectOverviewTab
          project={project}
          surveys={surveys}
          insights={insights}
          overviewStats={overviewStats}
          signalsData={signalsData}
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
