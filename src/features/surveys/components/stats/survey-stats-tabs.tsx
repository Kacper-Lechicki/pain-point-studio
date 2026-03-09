'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { useTranslations } from 'next-intl';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { SurveyStats } from '@/features/surveys/actions/get-survey-stats';
import type { UserSurvey } from '@/features/surveys/actions/get-user-surveys';

import { OverviewTab } from './overview-tab';
import { QuestionsTab } from './questions-tab';
import { ResponsesTab } from './responses-tab';

type TabValue = 'overview' | 'responses' | 'questions';

const VALID_TABS: TabValue[] = ['overview', 'responses', 'questions'];

function TabCount({ count }: { count: number }) {
  return (
    <>
      {' '}
      <span className="text-muted-foreground text-xs tabular-nums">({count})</span>
    </>
  );
}

interface SurveyStatsTabsProps {
  stats: SurveyStats;
  survey: UserSurvey | null;
  shareUrl: string | null;
  onShare: () => void;
  /** Timestamp that changes on each realtime sync — forwarded to ResponsesTab. */
  refreshTrigger?: number | undefined;
}

export function SurveyStatsTabs({ stats, refreshTrigger }: SurveyStatsTabsProps) {
  const t = useTranslations('surveys.stats');
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

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange}>
      <TabsList variant="line">
        <TabsTrigger value="overview">{t('tabs.overview')}</TabsTrigger>
        <TabsTrigger value="responses">
          {t('tabs.responses')}
          <TabCount count={stats.totalResponses} />
        </TabsTrigger>
        <TabsTrigger value="questions">
          {t('tabs.questions')}
          <TabCount count={stats.questions.length} />
        </TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="pt-5">
        <OverviewTab />
      </TabsContent>

      <TabsContent value="responses" className="pt-5">
        <ResponsesTab
          surveyId={stats.survey.id}
          totalResponses={stats.totalResponses}
          refreshTrigger={refreshTrigger}
        />
      </TabsContent>

      <TabsContent value="questions" className="pt-5">
        <QuestionsTab questions={stats.questions} hasResponses={stats.completedResponses > 0} />
      </TabsContent>
    </Tabs>
  );
}
