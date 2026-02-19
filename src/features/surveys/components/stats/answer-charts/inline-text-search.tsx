'use client';

import { useCallback, useMemo, useState } from 'react';

import { endOfDay, format, isAfter, isBefore, startOfDay } from 'date-fns';
import { CalendarIcon, Filter, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { DateRange } from 'react-day-picker';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ListPagination } from '@/components/ui/list-pagination';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { SearchInput } from '@/components/ui/search-input';
import { SortDropdown } from '@/components/ui/sort-dropdown';
import { SingleResponseDialog } from '@/features/surveys/components/stats/answer-charts/single-response-dialog';
import { TextResponseList } from '@/features/surveys/components/stats/answer-charts/text-response-list';
import { useKeywordExtraction } from '@/features/surveys/hooks/use-keyword-extraction';
import { usePagination, useResetPaginationOnChange } from '@/hooks/common/use-pagination';
import { sortOptionsAlphabetically } from '@/lib/common/sort-options';
import { buildHighlightRegex, highlightText } from '@/lib/common/text-highlight';

type SortMode = 'newest' | 'longest' | 'shortest' | 'az';

export interface ResponseItem {
  text: string;
  completedAt: string | null;
}

interface InlineTextSearchProps {
  responses: ResponseItem[];
  questionText: string;
}

const SORT_MODES: SortMode[] = ['newest', 'longest', 'shortest', 'az'];

export function InlineTextSearch({ responses, questionText }: InlineTextSearchProps) {
  const t = useTranslations();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeKeyword, setActiveKeyword] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>('newest');
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [dialogResponse, setDialogResponse] = useState<string | null>(null);

  const responseTexts = useMemo(() => responses.map((r) => r.text), [responses]);
  const keywords = useKeywordExtraction(responseTexts);

  const dateBounds = useMemo(() => {
    let min: Date | null = null;
    let max: Date | null = null;

    for (const r of responses) {
      if (!r.completedAt) {
        continue;
      }

      const d = new Date(r.completedAt);

      if (!min || d < min) {
        min = d;
      }

      if (!max || d > max) {
        max = d;
      }
    }

    return {
      min: min ? startOfDay(min) : null,
      max: max ? endOfDay(max) : null,
    };
  }, [responses]);

  const filteredResponses = useMemo(() => {
    let result = [...responses];

    if (searchQuery.trim()) {
      const lc = searchQuery.toLowerCase();
      result = result.filter((item) => item.text.toLowerCase().includes(lc));
    }

    if (activeKeyword) {
      const lc = activeKeyword.toLowerCase();
      result = result.filter((item) => item.text.toLowerCase().includes(lc));
    }

    if (dateRange?.from) {
      const from = startOfDay(dateRange.from);
      result = result.filter((item) => {
        if (!item.completedAt) {
          return false;
        }

        return !isBefore(new Date(item.completedAt), from);
      });
    }

    if (dateRange?.to) {
      const to = endOfDay(dateRange.to);
      result = result.filter((item) => {
        if (!item.completedAt) {
          return false;
        }

        return !isAfter(new Date(item.completedAt), to);
      });
    }

    switch (sortMode) {
      case 'longest':
        result.sort((a, b) => b.text.length - a.text.length);
        break;
      case 'shortest':
        result.sort((a, b) => a.text.length - b.text.length);
        break;
      case 'az':
        result.sort((a, b) => a.text.localeCompare(b.text));
        break;
      case 'newest':
      default:
        break;
    }

    return result;
  }, [responses, searchQuery, activeKeyword, sortMode, dateRange]);

  const pagination = usePagination({ totalItems: filteredResponses.length, defaultPerPage: 5 });

  useResetPaginationOnChange(pagination.goToPage, [
    searchQuery,
    activeKeyword,
    sortMode,
    dateRange,
  ]);

  const paginatedResponses = useMemo(
    () => filteredResponses.slice(pagination.startIndex, pagination.endIndex),
    [filteredResponses, pagination.startIndex, pagination.endIndex]
  );

  const highlightRegex = useMemo(() => {
    const words: string[] = [];

    if (searchQuery.trim()) {
      words.push(searchQuery.trim());
    }

    if (activeKeyword) {
      words.push(activeKeyword);
    }

    return buildHighlightRegex(words);
  }, [searchQuery, activeKeyword]);

  const highlightFn = useCallback(
    (text: string) => highlightText(text, highlightRegex),
    [highlightRegex]
  );

  const hasDateFilter = dateRange?.from != null;
  const isFiltering = searchQuery.trim().length > 0 || activeKeyword != null || hasDateFilter;

  const sortOptions = useMemo(
    () =>
      sortOptionsAlphabetically(
        SORT_MODES.map((v) => ({
          value: v,
          label: t(`surveys.stats.sort.${v}` as Parameters<typeof t>[0]),
        }))
      ),
    [t]
  );

  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setActiveKeyword(null);
    setDateRange(undefined);
  }, []);

  const dateLabel = useMemo(() => {
    if (!dateRange?.from) {
      return null;
    }

    if (dateRange.to) {
      return `${format(dateRange.from, 'MMM d')} – ${format(dateRange.to, 'MMM d')}`;
    }

    return format(dateRange.from, 'MMM d');
  }, [dateRange]);

  return (
    <>
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <SearchInput
            size="sm"
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder={t('surveys.stats.dialog.searchPlaceholder' as Parameters<typeof t>[0])}
            className="basis-full sm:max-w-64 sm:flex-1 sm:basis-auto"
          />

          {keywords.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant={activeKeyword ? 'secondary' : 'outline'}
                  size="sm"
                  className="shrink-0 gap-1.5 text-xs"
                >
                  <Filter className="size-3.5" />
                  <span className="hidden sm:inline">
                    {activeKeyword
                      ? activeKeyword
                      : t('surveys.stats.filter.keyword' as Parameters<typeof t>[0])}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-36">
                <DropdownMenuRadioGroup
                  value={activeKeyword ?? ''}
                  onValueChange={(v) => setActiveKeyword(v === '' ? null : v)}
                >
                  <DropdownMenuRadioItem value="">
                    {t('surveys.stats.filter.all' as Parameters<typeof t>[0])}
                  </DropdownMenuRadioItem>
                  {keywords.map(({ word, count }) => (
                    <DropdownMenuRadioItem key={word} value={word}>
                      <span className="flex-1">{word}</span>
                      <span className="text-muted-foreground ml-3 text-[11px] tabular-nums">
                        {count}
                      </span>
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
                {activeKeyword && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={clearFilters}>
                      <X className="size-3.5" aria-hidden />
                      {t('surveys.stats.dialog.clearAll' as Parameters<typeof t>[0])}
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <div className="ml-auto flex shrink-0 items-center gap-1.5">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={hasDateFilter ? 'secondary' : 'outline'}
                  size="sm"
                  className="shrink-0 gap-1.5 text-xs"
                >
                  <CalendarIcon className="size-3.5" />
                  <span className="hidden sm:inline">
                    {dateLabel ?? t('surveys.stats.filter.dateRange' as Parameters<typeof t>[0])}
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="range"
                  selected={dateRange}
                  onSelect={setDateRange}
                  defaultMonth={dateRange?.from ?? dateBounds.max ?? new Date()}
                  disabled={[
                    ...(dateBounds.min ? [{ before: dateBounds.min }] : []),
                    ...(dateBounds.max ? [{ after: dateBounds.max }] : []),
                  ]}
                  className="p-2 [--cell-size:--spacing(7)] [&_.rdp-month]:gap-2 [&_.rdp-nav]:h-(--cell-size) [&_.rdp-week]:mt-0.5"
                  fixedWeeks
                />
                {hasDateFilter && (
                  <div className="border-t px-2 py-1.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-xs"
                      onClick={() => setDateRange(undefined)}
                    >
                      <X className="size-3" />
                      {t('surveys.stats.filter.clearDate' as Parameters<typeof t>[0])}
                    </Button>
                  </div>
                )}
              </PopoverContent>
            </Popover>

            <SortDropdown
              size="sm"
              sortBy={sortMode}
              onSortByChange={setSortMode}
              options={sortOptions}
              sortDir={sortMode === 'shortest' ? 'asc' : 'desc'}
              sortLabel={t(`surveys.stats.sort.${sortMode}` as Parameters<typeof t>[0])}
              className="shrink-0"
            />
          </div>
        </div>

        {isFiltering && (
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-[10px] tabular-nums">
              {filteredResponses.length} / {responses.length}
            </span>
            <button
              type="button"
              onClick={clearFilters}
              className="text-muted-foreground hover:text-foreground flex items-center gap-0.5 text-[10px] transition-colors"
            >
              <X className="size-2.5" />
              {t('surveys.stats.dialog.clearAll' as Parameters<typeof t>[0])}
            </button>
          </div>
        )}

        {paginatedResponses.length === 0 ? (
          <p className="text-muted-foreground py-4 text-center text-xs">
            {t('surveys.stats.dialog.noResults' as Parameters<typeof t>[0])}
          </p>
        ) : (
          <TextResponseList
            items={paginatedResponses}
            highlightFn={highlightFn}
            onItemClick={setDialogResponse}
          />
        )}

        <ListPagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          perPage={pagination.perPage}
          totalItems={pagination.totalItems}
          startIndex={pagination.startIndex}
          endIndex={pagination.endIndex}
          canGoNext={pagination.canGoNext}
          canGoPrev={pagination.canGoPrev}
          onPageChange={pagination.goToPage}
          onPerPageChange={pagination.setPerPage}
          onNextPage={pagination.nextPage}
          onPrevPage={pagination.prevPage}
        />
      </div>

      <SingleResponseDialog
        open={dialogResponse != null}
        onOpenChange={(open) => {
          if (!open) {
            setDialogResponse(null);
          }
        }}
        questionText={questionText}
        responseText={dialogResponse ?? ''}
      />
    </>
  );
}
