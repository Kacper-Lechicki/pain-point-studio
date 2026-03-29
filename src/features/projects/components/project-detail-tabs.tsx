'use client';

import { type ReactNode, useState } from 'react';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { useTranslations } from 'next-intl';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { SurveySignalData } from '@/features/projects/actions/get-project-signals-data';
import { ProjectNotesTab } from '@/features/projects/components/project-notes-tab';
import { ProjectOverviewTab } from '@/features/projects/components/project-overview-tab';
import { ProjectSurveysTab } from '@/features/projects/components/project-surveys-tab';
import type {
  Project,
  ProjectNoteFolder,
  ProjectNoteMeta,
  ProjectOverviewStats,
} from '@/features/projects/types';
import type { UserSurvey } from '@/features/surveys/types';
import { getCreateSurveyUrl } from '@/lib/common/urls/survey-urls';

type TabValue = 'overview' | 'surveys' | 'notes';

const VALID_TABS: TabValue[] = ['overview', 'surveys', 'notes'];

interface ProjectDetailTabsProps {
  project: Project;
  surveys: UserSurvey[];
  surveyListSlot: ReactNode;
  notesMeta: ProjectNoteMeta[];
  noteFolders: ProjectNoteFolder[];
  overviewStats: ProjectOverviewStats;
  signalsData: SurveySignalData[];
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

function getInitialTab(searchParams: URLSearchParams): TabValue {
  const raw = searchParams.get('tab');

  return raw && VALID_TABS.includes(raw as TabValue) ? (raw as TabValue) : 'overview';
}

export function ProjectDetailTabs({
  project,
  surveys,
  surveyListSlot,
  notesMeta,
  noteFolders,
  overviewStats,
  signalsData,
}: ProjectDetailTabsProps) {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState<TabValue>(() => getInitialTab(searchParams));

  const handleTabChange = (value: string) => {
    const tab = value as TabValue;
    setActiveTab(tab);

    const params = new URLSearchParams(searchParams.toString());

    if (tab === 'overview') {
      params.delete('tab');
    } else {
      params.set('tab', tab);
    }

    const qs = params.toString();
    window.history.replaceState(null, '', `${pathname}${qs ? `?${qs}` : ''}`);
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
        <TabsTrigger value="notes">
          {t('projects.detail.tabs.notes')}
          <TabCount count={activeNotesCount} />
        </TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="pt-5">
        <ProjectOverviewTab
          project={project}
          surveys={surveys}
          overviewStats={overviewStats}
          signalsData={signalsData}
        />
      </TabsContent>

      <TabsContent value="surveys" className="pt-5">
        <ProjectSurveysTab
          project={project}
          hasSurveys={surveys.length > 0}
          onCreateSurvey={handleCreateSurvey}
        >
          {surveyListSlot}
        </ProjectSurveysTab>
      </TabsContent>

      <TabsContent value="notes" className="pt-5">
        <ProjectNotesTab project={project} initialNotes={notesMeta} initialFolders={noteFolders} />
      </TabsContent>
    </Tabs>
  );
}
