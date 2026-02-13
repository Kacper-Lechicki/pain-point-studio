'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { ClipboardList, MousePointerClick } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getSurveyWithQuestions } from '@/features/surveys/actions';
import type { UserSurvey } from '@/features/surveys/actions/get-user-surveys';
import type { MappedQuestion } from '@/features/surveys/lib/map-question-row';
import type { SurveyStatus } from '@/features/surveys/types';
import { useBreakpoint } from '@/hooks/common/use-breakpoint';

import { SurveyDetailPanel } from './survey-detail-panel';
import { SurveyListRow } from './survey-list-row';
import {
  SurveyListToolbar,
  type SurveySortBy,
  type SurveyStatusFilter,
} from './survey-list-toolbar';

const STATUS_TRANSITIONS: Record<string, SurveyStatus | null> = {
  close: 'closed',
  reopen: 'active',
  archive: 'archived',
  delete: null,
} as const;

interface SurveyListProps {
  initialSurveys: UserSurvey[];
}

export const SurveyList = ({ initialSurveys }: SurveyListProps) => {
  const t = useTranslations('surveys.dashboard');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isMd = useBreakpoint('md');
  const [surveys, setSurveys] = useState(initialSurveys);
  const [statusFilter, setStatusFilter] = useState<SurveyStatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SurveySortBy>('updated');

  const selectedId = searchParams.get('selected');
  const [questions, setQuestions] = useState<MappedQuestion[] | null>(null);
  const fetchedForRef = useRef<string | null>(null);

  // Fetch question data when a survey is selected
  useEffect(() => {
    if (!selectedId || fetchedForRef.current === selectedId) {
      return;
    }

    fetchedForRef.current = selectedId;
    queueMicrotask(() => setQuestions(null));

    getSurveyWithQuestions(selectedId)
      .then((data) => {
        if (data && fetchedForRef.current === selectedId) {
          setQuestions(data.questions);
        }
      })
      .catch(() => {});
  }, [selectedId]);

  const statusCounts = useMemo(() => {
    const counts: Record<SurveyStatusFilter, number> = {
      all: 0,
      active: 0,
      draft: 0,
      closed: 0,
    };

    for (const s of surveys) {
      if (s.status !== 'archived' && s.status in counts) {
        counts[s.status as SurveyStatusFilter]++;
      }
    }

    counts.all = counts.active + counts.draft + counts.closed;

    return counts;
  }, [surveys]);

  const kpiSummary = useMemo(() => {
    const activeCount = surveys.filter((s) => s.status === 'active').length;
    const totalResponses = surveys.reduce((sum, s) => sum + s.completedCount, 0);

    return {
      surveyCount: surveys.length,
      activeCount,
      totalResponses,
    };
  }, [surveys]);

  const filteredSurveys = useMemo(() => {
    let result =
      statusFilter === 'all' ? surveys : surveys.filter((s) => s.status === statusFilter);

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (s) => s.title.toLowerCase().includes(q) || s.description.toLowerCase().includes(q)
      );
    }

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

  const selectedSurvey = useMemo(
    () => (selectedId ? (surveys.find((s) => s.id === selectedId) ?? null) : null),
    [surveys, selectedId]
  );

  const setSelected = useCallback(
    (id: string | null) => {
      if (id !== selectedId) {
        fetchedForRef.current = null;
        setQuestions(null);
      }

      const next = new URLSearchParams(searchParams.toString());

      if (id) {
        next.set('selected', id);
      } else {
        next.delete('selected');
      }

      const q = next.toString();

      router.replace(q ? `${pathname}?${q}` : pathname);
    },
    [selectedId, searchParams, router, pathname]
  );

  const isFiltered = statusFilter !== 'all';

  const handleStatusChange = (surveyId: string, action: string) => {
    const newStatus = STATUS_TRANSITIONS[action] as SurveyStatus | null | undefined;

    if (newStatus === undefined) {
      return;
    }

    setSurveys((prev) => {
      if (newStatus === null) {
        if (selectedId === surveyId) {
          setSelected(null);
        }

        return prev.filter((s) => s.id !== surveyId);
      }

      return prev.map((s) =>
        s.id === surveyId ? { ...s, status: newStatus, updatedAt: new Date().toISOString() } : s
      );
    });
  };

  const showSheet = !!selectedId && !!selectedSurvey;

  return (
    <div className="space-y-4">
      {/* KPI summary */}
      {kpiSummary.surveyCount > 0 && (
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-x-4 gap-y-1">
          <div className="text-muted-foreground flex min-w-0 flex-wrap items-center gap-x-3 text-xs">
            <span className="shrink-0">
              <span className="text-foreground text-base font-semibold tabular-nums">
                {kpiSummary.surveyCount}
              </span>
              <span className="ml-1">{t('summary.totalLabel')}</span>
            </span>
            <span className="text-border shrink-0" aria-hidden>
              /
            </span>
            <span className="shrink-0">
              <span className="text-base font-semibold text-emerald-600 tabular-nums dark:text-emerald-400">
                {kpiSummary.activeCount}
              </span>
              <span className="ml-1">{t('summary.activeLabel')}</span>
            </span>
            <span className="text-border shrink-0" aria-hidden>
              /
            </span>
            <span className="shrink-0">
              <span className="text-foreground text-base font-semibold tabular-nums">
                {kpiSummary.totalResponses}
              </span>
              <span className="ml-1">{t('summary.responsesLabel')}</span>
            </span>
          </div>
          <span className="text-muted-foreground hidden shrink-0 items-center gap-1 text-[11px] md:flex">
            <MousePointerClick className="size-3" aria-hidden />
            {t('clickHint')}
          </span>
        </div>
      )}

      {/* Toolbar */}
      <SurveyListToolbar
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        sortBy={sortBy}
        onSortByChange={setSortBy}
        statusCounts={statusCounts}
      />

      {/* List content */}
      {filteredSurveys.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title={
            searchQuery.trim()
              ? t('emptySearch.title', { query: searchQuery })
              : t('emptyFilter.title')
          }
          description={
            searchQuery.trim() ? t('emptySearch.description') : t('emptyFilter.description')
          }
          action={
            (searchQuery.trim() || isFiltered) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                }}
              >
                {t('clearFilters')}
              </Button>
            )
          }
        />
      ) : isMd ? (
        <div className="border-border/50 overflow-hidden rounded-lg border">
          <Table className="table-fixed">
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead className="w-[30%]">{t('table.title')}</TableHead>
                <TableHead className="border-border/30 border-l">{t('table.status')}</TableHead>
                <TableHead className="border-border/30 border-l">{t('table.questions')}</TableHead>
                <TableHead className="border-border/30 border-l">{t('table.responses')}</TableHead>
                <TableHead className="border-border/30 hidden border-l lg:table-cell">
                  {t('table.lastResponse')}
                </TableHead>
                <TableHead className="border-border/30 hidden border-l text-center xl:table-cell">
                  {t('table.activity')}
                </TableHead>
                <TableHead className="w-10" aria-hidden />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSurveys.map((survey: UserSurvey) => (
                <SurveyListRow
                  key={survey.id}
                  survey={survey}
                  isSelected={selectedId === survey.id}
                  onSelect={setSelected}
                  onStatusChange={handleStatusChange}
                  variant="table"
                />
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="flex min-w-0 flex-col gap-2" role="list">
          {filteredSurveys.map((survey: UserSurvey) => (
            <SurveyListRow
              key={survey.id}
              survey={survey}
              isSelected={selectedId === survey.id}
              onSelect={setSelected}
              onStatusChange={handleStatusChange}
              variant="card"
            />
          ))}
        </div>
      )}

      {/* Detail sheet — always a sliding sidebar */}
      <Sheet open={showSheet} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent
          side="right"
          className="flex h-full w-[85%] max-w-[420px] flex-col gap-0 overflow-y-auto p-0 sm:max-w-[420px]"
          showCloseButton={true}
        >
          <SheetHeader className="border-border h-14 shrink-0 flex-row items-center gap-0 border-b px-4 py-0 pr-12">
            <SheetTitle className="text-foreground text-base font-semibold">
              {t('detailPanel.detailsLabel')}
            </SheetTitle>
            <SheetDescription className="sr-only">{selectedSurvey?.title}</SheetDescription>
          </SheetHeader>
          {showSheet && selectedSurvey && (
            <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-4 pb-16">
              <SurveyDetailPanel
                survey={selectedSurvey}
                questions={questions}
                onStatusChange={handleStatusChange}
                embeddedInSheet
              />
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};
