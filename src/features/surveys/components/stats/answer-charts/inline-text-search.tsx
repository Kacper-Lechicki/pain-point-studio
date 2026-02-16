'use client';

import { useCallback, useMemo, useState } from 'react';

import { ArrowDown, ArrowUp, Filter, Search, X } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';

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
import { Input } from '@/components/ui/input';
import { STOPWORDS } from '@/features/surveys/lib/stopwords';
import { cn } from '@/lib/common/utils';

import { SingleResponseDialog } from './single-response-dialog';

const MAX_KEYWORDS = 10;
const MIN_WORD_LENGTH = 3;
const INITIAL_VISIBLE = 5;
const MAX_VISIBLE = 10;

type SortMode = 'newest' | 'longest' | 'shortest' | 'az';

export interface ResponseItem {
  text: string;
  completedAt: string | null;
}

interface InlineTextSearchProps {
  responses: ResponseItem[];
  questionText: string;
}

/** Build a regex that matches any of the given keywords (case-insensitive, word boundary). */
function buildHighlightRegex(words: string[]): RegExp | null {
  if (words.length === 0) {
    return null;
  }

  const escaped = words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

  return new RegExp(`\\b(${escaped.join('|')})\\b`, 'gi');
}

/** Split text into segments for highlighting. */
function highlightText(text: string, regex: RegExp | null): { text: string; highlight: boolean }[] {
  if (!regex) {
    return [{ text, highlight: false }];
  }

  const segments: { text: string; highlight: boolean }[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  regex.lastIndex = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({
        text: text.slice(lastIndex, match.index),
        highlight: false,
      });
    }

    segments.push({ text: match[0], highlight: true });
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    segments.push({ text: text.slice(lastIndex), highlight: false });
  }

  return segments.length > 0 ? segments : [{ text, highlight: false }];
}

export function InlineTextSearch({ responses, questionText }: InlineTextSearchProps) {
  const t = useTranslations();
  const format = useFormatter();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeKeyword, setActiveKeyword] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>('newest');
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);
  const [dialogResponse, setDialogResponse] = useState<string | null>(null);

  // ── Keywords ────────────────────────────────────────────────────────
  const keywords = useMemo(() => {
    if (responses.length === 0) {
      return [];
    }

    const counts = new Map<string, number>();

    for (const item of responses) {
      const words = item.text
        .toLowerCase()
        .replace(/[^a-zA-Z0-9\s]/g, '')
        .split(/\s+/);

      for (const word of words) {
        if (word.length >= MIN_WORD_LENGTH && !STOPWORDS.has(word)) {
          counts.set(word, (counts.get(word) ?? 0) + 1);
        }
      }
    }

    return Array.from(counts.entries())
      .filter(([, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, MAX_KEYWORDS)
      .map(([word, count]) => ({ word, count }));
  }, [responses]);

  // ── Filtered + sorted ──────────────────────────────────────────────
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

  // ── Highlight regex ────────────────────────────────────────────────
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

  const visible = filteredResponses.slice(0, visibleCount);
  const hasMore = visibleCount < filteredResponses.length && visibleCount < MAX_VISIBLE;
  const remaining = Math.min(filteredResponses.length - visibleCount, MAX_VISIBLE - visibleCount);
  const isFiltering = searchQuery.trim().length > 0 || activeKeyword != null;
  const isExpanded = visibleCount > INITIAL_VISIBLE;

  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setActiveKeyword(null);
    setVisibleCount(INITIAL_VISIBLE);
  }, []);

  const sortModes: SortMode[] = ['newest', 'longest', 'shortest', 'az'];

  return (
    <>
      <div className="space-y-2">
        {/* ── Toolbar: search + filter + sort ─────────────────── */}
        <div className="flex flex-wrap items-center gap-1.5">
          {/* Search input — constrained width */}
          <div className="relative min-w-0 basis-full sm:max-w-64 sm:flex-1 sm:basis-auto">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2" />
            <Input
              size="sm"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setVisibleCount(INITIAL_VISIBLE);
              }}
              placeholder={t('surveys.stats.dialog.searchPlaceholder' as Parameters<typeof t>[0])}
              className="pr-7 pl-8 text-xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setVisibleCount(INITIAL_VISIBLE);
                }}
                className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2 -translate-y-1/2"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          {/* Keyword filter dropdown */}
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
                    setVisibleCount(INITIAL_VISIBLE);
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

          {/* Sort dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn('min-w-24 shrink-0 gap-1.5 text-xs', !keywords.length && 'ml-auto')}
              >
                {sortMode === 'shortest' ? (
                  <ArrowUp className="size-3.5" aria-hidden />
                ) : (
                  <ArrowDown className="size-3.5" aria-hidden />
                )}
                <span className="hidden sm:inline">
                  {t(`surveys.stats.sort.${sortMode}` as Parameters<typeof t>[0])}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-32">
              <DropdownMenuRadioGroup
                value={sortMode}
                onValueChange={(v) => setSortMode(v as SortMode)}
              >
                {sortModes.map((mode) => (
                  <DropdownMenuRadioItem key={mode} value={mode}>
                    {t(`surveys.stats.sort.${mode}` as Parameters<typeof t>[0])}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* ── Active filter indicator (only when filtering) ───── */}
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

        {/* ── Response list ─────────────────────────────────────── */}
        {visible.length === 0 ? (
          <p className="text-muted-foreground py-4 text-center text-xs">
            {t('surveys.stats.dialog.noResults' as Parameters<typeof t>[0])}
          </p>
        ) : (
          <div className={cn(isExpanded && 'max-h-[26rem] overflow-y-auto')}>
            <ul className="space-y-1.5" role="list">
              {visible.map((item, i) => {
                const segments = highlightText(item.text, highlightRegex);

                return (
                  <li key={i}>
                    <button
                      type="button"
                      onClick={() => setDialogResponse(item.text)}
                      className="border-border/60 bg-muted hover:bg-muted/80 flex h-24 w-full cursor-pointer flex-col rounded-lg border px-3 py-2 text-left transition-colors sm:px-4"
                    >
                      <p className="text-foreground line-clamp-3 min-w-0 text-xs leading-relaxed break-words whitespace-pre-wrap">
                        {segments.map((seg, j) =>
                          seg.highlight ? (
                            <mark
                              key={j}
                              className="rounded-sm bg-violet-500/20 px-0.5 text-inherit dark:bg-violet-400/25"
                            >
                              {seg.text}
                            </mark>
                          ) : (
                            <span key={j}>{seg.text}</span>
                          )
                        )}
                      </p>
                      {item.completedAt && (
                        <span className="text-muted-foreground mt-auto ml-auto origin-bottom-right scale-[0.8] pt-1 text-[10px] tabular-nums">
                          {format.dateTime(new Date(item.completedAt), {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* ── Load more ────────────────────────────────────────── */}
        {hasMore && (
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground w-full gap-1.5 text-xs"
            onClick={() => setVisibleCount(MAX_VISIBLE)}
          >
            {t('surveys.stats.showMore')} ({remaining})
          </Button>
        )}
      </div>

      {/* ── Single response dialog ─────────────────────────────── */}
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
