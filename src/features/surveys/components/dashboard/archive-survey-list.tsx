'use client';

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { Archive, ArrowUpDown, MousePointerClick, Search, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getSurveyWithQuestions, restoreSurvey } from '@/features/surveys/actions';
import type { UserSurvey } from '@/features/surveys/actions/get-user-surveys';
import type { MappedQuestion } from '@/features/surveys/lib/map-question-row';
import { useBreakpoint } from '@/hooks/common/use-breakpoint';
import { cn } from '@/lib/common/utils';

import { SurveyDetailPanel } from './survey-detail-panel';
import { SurveyListRow } from './survey-list-row';

type ArchiveSortBy = 'updated' | 'created' | 'title';

interface ArchiveSurveyListProps {
  initialSurveys: UserSurvey[];
}

const SORT_OPTIONS: ArchiveSortBy[] = ['updated', 'created', 'title'];

export function ArchiveSurveyList({ initialSurveys }: ArchiveSurveyListProps) {
  const t = useTranslations('surveys.archive');
  const tDashboard = useTranslations('surveys.dashboard');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isMd = useBreakpoint('md');
  const [, startTransition] = useTransition();

  const selectedId = searchParams.get('selected');
  const [surveys, setSurveys] = useState(initialSurveys);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<ArchiveSortBy>('updated');
  const [questions, setQuestions] = useState<MappedQuestion[] | null>(null);
  const fetchedForRef = useRef<string | null>(null);

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

  const hasSearch = searchQuery.trim().length > 0;

  const filteredSurveys = useMemo(() => {
    let result = surveys;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (s) => s.title.toLowerCase().includes(q) || s.description.toLowerCase().includes(q)
      );
    }

    return [...result].sort((a, b) => {
      switch (sortBy) {
        case 'updated':
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        case 'created':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'title':
          return a.title.localeCompare(b.title);
      }
    });
  }, [surveys, searchQuery, sortBy]);

  const handleRestore = (surveyId: string) => {
    startTransition(async () => {
      const result = await restoreSurvey({ surveyId });

      if (result.success) {
        toast.success(t('toast.restored'));

        if (selectedId === surveyId) {
          setSelected(null);
        }

        setSurveys((prev) => prev.filter((s) => s.id !== surveyId));
      } else {
        toast.error(t('toast.actionFailed'));
      }
    });
  };

  const handleStatusChange = (surveyId: string, action: string) => {
    if (action === 'restore') {
      handleRestore(surveyId);
    }
  };

  const selectedSurvey = useMemo(
    () => (selectedId ? (surveys.find((s) => s.id === selectedId) ?? null) : null),
    [surveys, selectedId]
  );

  const showSheet = !!selectedId && !!selectedSurvey;

  if (filteredSurveys.length === 0 && !hasSearch && surveys.length === 0) {
    return (
      <EmptyState icon={Archive} title={t('empty.title')} description={t('empty.description')} />
    );
  }

  return (
    <div className="space-y-4">
      {surveys.length > 0 && (
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-x-4 gap-y-1">
          <div className="text-muted-foreground flex min-w-0 flex-wrap items-center gap-x-3 text-xs">
            <span className="shrink-0">
              <span className="text-foreground text-base font-semibold tabular-nums">
                {surveys.length}
              </span>
              <span className="ml-1">{tDashboard('summary.totalLabel')}</span>
            </span>
          </div>
          <span className="text-muted-foreground/50 hidden shrink-0 items-center gap-1 text-[11px] md:flex">
            <MousePointerClick className="size-3" aria-hidden />
            {tDashboard('clickHint')}
          </span>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 basis-full sm:max-w-sm sm:flex-1 sm:basis-auto">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={tDashboard('search.placeholder')}
            className={cn('pl-9', hasSearch && 'pr-9')}
          />
          {hasSearch && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 transition-colors"
              aria-label="Clear search"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto shrink-0 gap-1.5">
              <ArrowUpDown className="size-4" />
              <span className="hidden sm:inline">{t(`sort.${sortBy}`)}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuRadioGroup
              value={sortBy}
              onValueChange={(v) => setSortBy(v as ArchiveSortBy)}
            >
              {SORT_OPTIONS.map((option) => (
                <DropdownMenuRadioItem key={option} value={option}>
                  {t(`sort.${option}`)}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {filteredSurveys.length === 0 ? (
        <EmptyState
          icon={Archive}
          title={hasSearch ? t('emptySearch.title', { query: searchQuery }) : t('empty.title')}
          description={hasSearch ? t('emptySearch.description') : t('empty.description')}
          action={
            hasSearch && (
              <Button variant="outline" size="sm" onClick={() => setSearchQuery('')}>
                {tDashboard('clearFilters')}
              </Button>
            )
          }
        />
      ) : isMd ? (
        <div className="border-border/50 overflow-hidden rounded-lg border">
          <Table className="table-fixed">
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead className="w-[30%]">{tDashboard('table.title')}</TableHead>
                <TableHead className="border-border/30 border-l">
                  {tDashboard('table.status')}
                </TableHead>
                <TableHead className="border-border/30 border-l">
                  {tDashboard('table.questions')}
                </TableHead>
                <TableHead className="border-border/30 border-l">
                  {tDashboard('table.responses')}
                </TableHead>
                <TableHead className="border-border/30 border-l">
                  {tDashboard('table.archivedAt')}
                </TableHead>
                <TableHead className="w-10" aria-hidden />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSurveys.map((survey) => (
                <SurveyListRow
                  key={survey.id}
                  survey={survey}
                  isSelected={selectedId === survey.id}
                  onSelect={setSelected}
                  onStatusChange={handleStatusChange}
                  onRestore={handleRestore}
                  variant="table"
                  archivedLayout
                />
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="flex min-w-0 flex-col gap-2" role="list">
          {filteredSurveys.map((survey) => (
            <SurveyListRow
              key={survey.id}
              survey={survey}
              isSelected={selectedId === survey.id}
              onSelect={setSelected}
              onStatusChange={handleStatusChange}
              onRestore={handleRestore}
              variant="card"
              archivedLayout
            />
          ))}
        </div>
      )}

      <Sheet open={showSheet} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent
          side="right"
          className="flex h-full w-[85%] max-w-[420px] flex-col gap-0 overflow-y-auto p-0 sm:max-w-[420px]"
          showCloseButton
        >
          <SheetHeader className="border-border h-14 shrink-0 flex-row items-center gap-0 border-b px-4 py-0 pr-12">
            <SheetTitle className="text-foreground text-base font-semibold">
              {tDashboard('detailPanel.detailsLabel')}
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
}
