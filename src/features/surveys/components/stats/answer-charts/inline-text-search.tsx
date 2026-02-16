'use client';

import { useCallback, useMemo, useState } from 'react';

import { Filter, X } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SearchInput } from '@/components/ui/search-input';
import { TEXT_SEARCH_INITIAL_VISIBLE, TEXT_SEARCH_MAX_VISIBLE } from '@/features/surveys/config';
import { useKeywordExtraction } from '@/features/surveys/hooks/use-keyword-extraction';
import { buildHighlightRegex, highlightText } from '@/lib/common/text-highlight';
import { cn } from '@/lib/common/utils';

import { SortDropdown } from '../../shared/sort-dropdown';
import { SingleResponseDialog } from './single-response-dialog';
import { TextResponseList } from './text-response-list';

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
  const [visibleCount, setVisibleCount] = useState(TEXT_SEARCH_INITIAL_VISIBLE);
  const [dialogResponse, setDialogResponse] = useState<string | null>(null);

  const responseTexts = useMemo(() => responses.map((r) => r.text), [responses]);
  const keywords = useKeywordExtraction(responseTexts);

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
  }, [responses, searchQuery, activeKeyword, sortMode]);

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

  const visible = filteredResponses.slice(0, visibleCount);
  const hasMore = visibleCount < filteredResponses.length && visibleCount < TEXT_SEARCH_MAX_VISIBLE;
  const remaining = Math.min(
    filteredResponses.length - visibleCount,
    TEXT_SEARCH_MAX_VISIBLE - visibleCount
  );
  const isFiltering = searchQuery.trim().length > 0 || activeKeyword != null;
  const isExpanded = visibleCount > TEXT_SEARCH_INITIAL_VISIBLE;

  const sortOptions = useMemo(
    () =>
      SORT_MODES.map((v) => ({
        value: v,
        label: t(`surveys.stats.sort.${v}` as Parameters<typeof t>[0]),
      })),
    [t]
  );

  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setActiveKeyword(null);
    setVisibleCount(TEXT_SEARCH_INITIAL_VISIBLE);
  }, []);

  return (
    <>
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <SearchInput
            size="sm"
            value={searchQuery}
            onChange={(v) => {
              setSearchQuery(v);
              setVisibleCount(TEXT_SEARCH_INITIAL_VISIBLE);
            }}
            placeholder={t('surveys.stats.dialog.searchPlaceholder' as Parameters<typeof t>[0])}
            className="basis-full sm:max-w-64 sm:flex-1 sm:basis-auto"
          />

          {keywords.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant={activeKeyword ? 'secondary' : 'outline'}
                  size="sm"
                  className="min-w-24 shrink-0 gap-1.5 text-xs"
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
                  onValueChange={(v) => {
                    setActiveKeyword(v === '' ? null : v);
                    setVisibleCount(TEXT_SEARCH_INITIAL_VISIBLE);
                  }}
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

          <SortDropdown
            size="sm"
            sortBy={sortMode}
            onSortByChange={setSortMode}
            options={sortOptions}
            sortDir={sortMode === 'shortest' ? 'asc' : 'desc'}
            sortLabel={t(`surveys.stats.sort.${sortMode}` as Parameters<typeof t>[0])}
            className={cn('min-w-24', !keywords.length && 'ml-auto')}
          />
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

        {visible.length === 0 ? (
          <p className="text-muted-foreground py-4 text-center text-xs">
            {t('surveys.stats.dialog.noResults' as Parameters<typeof t>[0])}
          </p>
        ) : (
          <TextResponseList
            items={visible}
            highlightFn={highlightFn}
            isExpanded={isExpanded}
            onItemClick={setDialogResponse}
          />
        )}

        {hasMore && (
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground w-full gap-1.5 text-xs"
            onClick={() => setVisibleCount(TEXT_SEARCH_MAX_VISIBLE)}
          >
            {t('surveys.stats.showMore')} ({remaining})
          </Button>
        )}
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
