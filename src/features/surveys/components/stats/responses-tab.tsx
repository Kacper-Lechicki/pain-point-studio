'use client';

import { useCallback, useState } from 'react';

import { Inbox } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { EmptyState } from '@/components/ui/empty-state';
import { ListPagination } from '@/components/ui/list-pagination';
import { Skeleton } from '@/components/ui/skeleton';
import { useResponseList } from '@/features/surveys/hooks/use-response-list';
import type {
  ResponseSortBy,
  SurveyResponseListItem,
} from '@/features/surveys/types/response-list';
import { useBreakpoint } from '@/hooks/common/use-breakpoint';
import type { PerPage } from '@/hooks/common/use-pagination';
import { cn } from '@/lib/common/utils';

import { ResponseCardRow } from './response-card-row';
import { ResponseDetailDialog } from './response-detail-dialog';
import { ResponsesTable } from './responses-table';
import { ResponsesToolbar } from './responses-toolbar';

interface ResponsesTabProps {
  surveyId: string;
  totalResponses: number;
}

function CardListSkeleton() {
  return (
    <div className="flex min-w-0 flex-col gap-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="border-border/50 bg-card flex flex-col gap-3 rounded-lg border p-3">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-6" />
            <Skeleton className="h-5 w-20" />
          </div>
          <div className="grid grid-cols-3 gap-x-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ResponsesTab({ surveyId, totalResponses }: ResponsesTabProps) {
  const t = useTranslations('surveys.stats');
  const isMd = useBreakpoint('md');
  const {
    items,
    totalCount,
    filters,
    isLoading,
    hasLoaded,
    setSearch,
    setStatus,
    setDevice,
    setHasContact,
    setDateRange,
    setSort,
    setPage,
    setPerPage,
    clearFilters,
  } = useResponseList({ surveyId });

  const [selectedResponse, setSelectedResponse] = useState<SurveyResponseListItem | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const handleRowClick = (response: SurveyResponseListItem) => {
    setSelectedResponse(response);
    setDetailOpen(true);
  };

  const handleNavigate = (direction: 'prev' | 'next') => {
    if (!selectedResponse) {
      return;
    }

    const currentIndex = items.findIndex((item) => item.id === selectedResponse.id);

    if (currentIndex === -1) {
      return;
    }

    const newIndex = direction === 'prev' ? currentIndex - 1 : currentIndex + 1;

    const next = items[newIndex];

    if (newIndex >= 0 && newIndex < items.length && next) {
      setSelectedResponse(next);
    }
  };

  const handleSortByColumn = useCallback(
    (key: ResponseSortBy) => {
      if (key === filters.sortBy) {
        setSort(key, filters.sortDir === 'asc' ? 'desc' : 'asc');
      } else {
        setSort(key, 'desc');
      }
    },
    [filters.sortBy, filters.sortDir, setSort]
  );

  const currentIndex = selectedResponse
    ? items.findIndex((item) => item.id === selectedResponse.id)
    : -1;

  // Pagination helpers
  const perPage = filters.perPage as PerPage;
  const totalPages = Math.max(1, Math.ceil(totalCount / perPage));
  const startIndex = (filters.page - 1) * perPage;
  const endIndex = Math.min(startIndex + perPage, totalCount);

  if (totalResponses === 0 && !hasLoaded) {
    return (
      <EmptyState
        icon={Inbox}
        title={t('overviewEmpty.title')}
        description={t('overviewEmpty.description')}
        accent="primary"
        variant="card"
      />
    );
  }

  const showLoading = (!hasLoaded || isLoading) && items.length === 0;
  const showEmpty = hasLoaded && !isLoading && items.length === 0;

  return (
    <div className="space-y-4">
      <ResponsesToolbar
        filters={filters}
        onSearchChange={setSearch}
        onStatusChange={setStatus}
        onDeviceChange={setDevice}
        onHasContactChange={setHasContact}
        onDateRangeChange={setDateRange}
        onSortChange={setSort}
        onClearFilters={clearFilters}
      />

      {showEmpty ? (
        <div className="border-border/50 text-muted-foreground rounded-lg border py-12 text-center text-sm">
          {t('responseList.noResults')}
        </div>
      ) : showLoading ? (
        isMd ? (
          <ResponsesTable
            items={[]}
            isLoading
            onRowClick={handleRowClick}
            sortBy={filters.sortBy}
            sortDir={filters.sortDir}
            onSortByColumn={handleSortByColumn}
          />
        ) : (
          <CardListSkeleton />
        )
      ) : isMd ? (
        <ResponsesTable
          items={items}
          isLoading={isLoading}
          onRowClick={handleRowClick}
          sortBy={filters.sortBy}
          sortDir={filters.sortDir}
          onSortByColumn={handleSortByColumn}
        />
      ) : (
        <div
          className={cn(
            'flex min-w-0 flex-col gap-2 transition-opacity',
            isLoading && 'opacity-60'
          )}
          role="list"
        >
          {items.map((item, index) => (
            <ResponseCardRow key={item.id} item={item} index={index} onRowClick={handleRowClick} />
          ))}
        </div>
      )}

      <ListPagination
        page={filters.page}
        totalPages={totalPages}
        perPage={perPage}
        totalItems={totalCount}
        startIndex={startIndex}
        endIndex={endIndex}
        canGoNext={filters.page < totalPages}
        canGoPrev={filters.page > 1}
        onPageChange={setPage}
        onPerPageChange={(pp) => setPerPage(pp)}
        onNextPage={() => setPage(filters.page + 1)}
        onPrevPage={() => setPage(filters.page - 1)}
      />

      <ResponseDetailDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        responseId={selectedResponse?.id ?? null}
        responseMeta={selectedResponse}
        canNavigatePrev={currentIndex > 0}
        canNavigateNext={currentIndex < items.length - 1}
        onNavigate={handleNavigate}
      />
    </div>
  );
}
