'use client';

import { useFormatter } from 'next-intl';

import type { ResponseItem } from '@/features/surveys/components/stats/answer-charts/inline-text-search';
import type { TextSegment } from '@/lib/common/text-highlight';

interface TextResponseListProps {
  items: ResponseItem[];
  highlightFn: (text: string) => TextSegment[];
  onItemClick: (text: string) => void;
}

export function TextResponseList({ items, highlightFn, onItemClick }: TextResponseListProps) {
  const format = useFormatter();

  return (
    <div>
      <ul className="space-y-1.5" role="list">
        {items.map((item, i) => {
          const segments = highlightFn(item.text);

          return (
            <li key={i}>
              <button
                type="button"
                onClick={() => onItemClick(item.text)}
                className="border-border/60 bg-muted hover:bg-muted/80 flex h-24 w-full cursor-pointer flex-col rounded-lg border px-3 py-2 text-left transition-colors sm:px-4"
              >
                <p className="text-foreground line-clamp-3 min-w-0 text-xs leading-relaxed wrap-break-word whitespace-pre-wrap">
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
  );
}
