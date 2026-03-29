'use client';

import { useRef, useState } from 'react';

import { usePathname, useSearchParams } from 'next/navigation';

import { LayoutDashboard, ListChecks, MessageSquareText } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { SurveyStats } from '@/features/surveys/types';

import { OverviewTab } from './overview-tab';
import { QuestionsTab } from './questions-tab';
import { ResponsesTab } from './responses-tab';

type TabValue = 'overview' | 'responses' | 'questions';

const VALID_TABS: TabValue[] = ['overview', 'responses', 'questions'];

function getInitialTab(searchParams: URLSearchParams): TabValue {
  const raw = searchParams.get('tab');

  return raw && VALID_TABS.includes(raw as TabValue) ? (raw as TabValue) : 'overview';
}

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
  shareUrl: string | null;
  onShare: () => void;
  /** Timestamp that changes on each realtime sync — forwarded to ResponsesTab. */
  refreshTrigger?: number | undefined;
}

export function SurveyStatsTabs({
  stats,
  shareUrl,
  onShare,
  refreshTrigger,
}: SurveyStatsTabsProps) {
  const t = useTranslations('surveys.stats');
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const tabsListRef = useRef<HTMLDivElement>(null);
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

    requestAnimationFrame(() => {
      tabsListRef.current?.scrollIntoView({ block: 'nearest', behavior: 'instant' });
    });
  };

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange}>
      <TabsList ref={tabsListRef} variant="line">
        <TabsTrigger value="overview">
          <LayoutDashboard />
          {t('tabs.overview')}
        </TabsTrigger>
        <TabsTrigger value="responses">
          <MessageSquareText />
          {t('tabs.responses')}
          <TabCount count={stats.totalResponses} />
        </TabsTrigger>
        <TabsTrigger value="questions">
          <ListChecks />
          {t('tabs.questions')}
          <TabCount count={stats.questions.length} />
        </TabsTrigger>
      </TabsList>

      <TabsContent forceMount value="overview" className="pt-5 data-[state=inactive]:hidden">
        <OverviewTab stats={stats} shareUrl={shareUrl} onShare={onShare} />
      </TabsContent>

      <TabsContent forceMount value="responses" className="pt-5 data-[state=inactive]:hidden">
        <ResponsesTab
          surveyId={stats.survey.id}
          totalResponses={stats.totalResponses}
          refreshTrigger={refreshTrigger}
        />
      </TabsContent>

      <TabsContent forceMount value="questions" className="pt-5 data-[state=inactive]:hidden">
        <QuestionsTab questions={stats.questions} hasResponses={stats.completedResponses > 0} />
      </TabsContent>
    </Tabs>
  );
}
