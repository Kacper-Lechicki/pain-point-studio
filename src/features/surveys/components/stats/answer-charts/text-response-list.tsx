'use client';

import { useCallback, useState } from 'react';

import { ChevronDown } from 'lucide-react';
import { useFormatter } from 'next-intl';

import type { ResponseItem } from '@/features/surveys/components/stats/answer-charts/inline-text-search';
import type { TextSegment } from '@/lib/common/text-highlight';
import { cn } from '@/lib/common/utils';

interface TextResponseListProps {
  items: ResponseItem[];
  highlightFn: (text: string) => TextSegment[];
}

export function TextResponseList({ items, highlightFn }: TextResponseListProps) {
  const format = useFormatter();
  const [expandedSet, setExpandedSet] = useState<Set<number>>(() => new Set());

  const toggle = useCallback((index: number) => {
    setExpandedSet((prev) => {
      const next = new Set(prev);

      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }

      return next;
    });
  }, []);

  return (
    <ul className="space-y-1.5" role="list">
      {items.map((item, i) => {
        const segments = highlightFn(item.text);
        const isExpanded = expandedSet.has(i);

        return (
          <li key={i}>
            <button
              type="button"
              onClick={() => toggle(i)}
              className="border-border/60 bg-muted hover:bg-muted/80 group flex w-full cursor-pointer flex-col rounded-lg border px-3 py-2 text-left transition-colors sm:px-4"
            >
              <p
                className={cn(
                  'text-foreground min-w-0 text-xs leading-relaxed wrap-break-word whitespace-pre-wrap',
                  isExpanded ? 'max-h-[200px] overflow-y-auto' : 'line-clamp-3'
                )}
              >
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

              <div className="mt-auto flex items-center pt-1">
                <ChevronDown
                  className={cn(
                    'text-muted-foreground size-3 transition-transform',
                    isExpanded && 'rotate-180'
                  )}
                  aria-hidden
                />

                {item.completedAt && (
                  <span className="text-muted-foreground ml-auto origin-bottom-right scale-[0.8] text-[10px] tabular-nums">
                    {format.dateTime(new Date(item.completedAt), {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </span>
                )}
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
