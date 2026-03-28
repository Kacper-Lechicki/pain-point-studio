'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { SurveyResponseListItem } from '@/features/surveys/types/response-list';
import { cn } from '@/lib/common/utils';

import { ResponseListItem } from './response-list-item';

interface ResponseListPaneProps {
  items: SurveyResponseListItem[];
  totalCount: number;
  selectedId: string | null;
  isLoading: boolean;
  hasLoaded: boolean;
  startIndex: number;
  page: number;
  totalPages: number;
  onSelect: (item: SurveyResponseListItem) => void;
  onPageChange: (page: number) => void;
}

const SKELETON_COUNT = 5;

function ListSkeleton() {
  return (
    <div className="flex flex-col">
      {Array.from({ length: SKELETON_COUNT }, (_, i) => (
        <div key={i} className="flex flex-col gap-2 border-b px-3 py-2.5">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-6" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>

          <div className="flex items-center gap-1">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-3 w-10" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ResponseListPane({
  items,
  totalCount,
  selectedId,
  isLoading,
  hasLoaded,
  startIndex,
  page,
  totalPages,
  onSelect,
  onPageChange,
}: ResponseListPaneProps) {
  const t = useTranslations('surveys.stats');

  const showEmpty = hasLoaded && !isLoading && items.length === 0;

  return (
    <div
      className={cn(
        'flex h-full w-full flex-col',
        'lg:border-border lg:w-[340px] lg:shrink-0 lg:border-r'
      )}
    >
      <div className="shrink-0 border-b px-4 py-3">
        <span className="text-xs font-semibold">{t('responsesCount', { count: totalCount })}</span>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {isLoading && <ListSkeleton />}

        {showEmpty && (
          <p className="text-muted-foreground px-4 py-8 text-center text-sm">{t('noResponses')}</p>
        )}

        {!isLoading &&
          items.map((item, idx) => (
            <ResponseListItem
              key={item.id}
              item={item}
              index={startIndex + idx}
              isActive={item.id === selectedId}
              onClick={() => onSelect(item)}
            />
          ))}
      </div>

      <div className="border-border flex shrink-0 items-center gap-1 border-t px-5 py-3">
        <Button
          variant="outline"
          size="icon-sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="size-4" />
        </Button>

        <span className="text-muted-foreground flex-1 text-center text-[11px] tabular-nums">
          {page} / {totalPages}
        </span>

        <Button
          variant="outline"
          size="icon-sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
