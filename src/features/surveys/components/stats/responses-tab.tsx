'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { ChevronLeft, Inbox } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { useResponseList } from '@/features/surveys/hooks/use-response-list';
import type { SurveyResponseListItem } from '@/features/surveys/types/response-list';
import { useBreakpoint } from '@/hooks/common/use-breakpoint';

import { ResponseDetailPane } from './response-detail-pane';
import { ResponseListPane } from './response-list-pane';
import { ResponseStatusBadge } from './response-status-badge';
import { ResponsesToolbar } from './responses-toolbar';

interface ResponsesTabProps {
  surveyId: string;
  totalResponses: number;
  refreshTrigger?: number | undefined;
}

export function ResponsesTab({ surveyId, totalResponses, refreshTrigger }: ResponsesTabProps) {
  const t = useTranslations('surveys.stats');
  const isLg = useBreakpoint('lg');
  const detailRef = useRef<HTMLDivElement>(null);

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
    clearFilters,
  } = useResponseList({ surveyId, refreshTrigger });

  const [selectedResponse, setSelectedResponse] = useState<SurveyResponseListItem | null>(null);
  const [showMobileDetail, setShowMobileDetail] = useState(false);

  const itemIds = items.map((i) => i.id).join(',');

  useEffect(() => {
    setSelectedResponse((prev) => {
      if (items.length === 0) {
        return prev;
      }

      const stillPresent = items.some((i) => i.id === prev?.id);

      return stillPresent ? prev : (items[0] ?? null);
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemIds]);

  const handleSelect = useCallback(
    (response: SurveyResponseListItem) => {
      setSelectedResponse(response);

      if (!isLg) {
        setShowMobileDetail(true);
      }
    },
    [isLg]
  );

  useEffect(() => {
    if (selectedResponse && isLg) {
      detailRef.current?.focus();
    }
  }, [selectedResponse, isLg]);

  const currentIndex = selectedResponse
    ? items.findIndex((item) => item.id === selectedResponse.id)
    : -1;

  if (totalResponses === 0) {
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
  const totalPages = Math.max(1, Math.ceil(totalCount / filters.perPage));
  const startIndex = (filters.page - 1) * filters.perPage;

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
      ) : isLg ? (
        <div className="border-border/50 flex h-[600px] overflow-hidden rounded-lg border">
          <ResponseListPane
            items={items}
            totalCount={totalCount}
            selectedId={selectedResponse?.id ?? null}
            isLoading={showLoading}
            hasLoaded={hasLoaded}
            startIndex={startIndex}
            page={filters.page}
            totalPages={totalPages}
            onSelect={handleSelect}
            onPageChange={setPage}
          />

          <div className="flex min-h-0 flex-1 flex-col outline-none" ref={detailRef} tabIndex={-1}>
            <ResponseDetailPane
              selectedId={selectedResponse?.id ?? null}
              selectedMeta={selectedResponse}
            />
          </div>
        </div>
      ) : (
        <div className="border-border/50 flex h-[500px] flex-col overflow-hidden rounded-lg border">
          {showMobileDetail && selectedResponse ? (
            <>
              <div className="border-border flex shrink-0 items-center gap-2 border-b px-4 py-3">
                <Button variant="ghost" size="icon-sm" onClick={() => setShowMobileDetail(false)}>
                  <ChevronLeft className="size-4" />
                </Button>

                <span className="flex-1 text-sm font-semibold">
                  {t('responseList.detailTitle')} #{currentIndex + 1}
                </span>

                <ResponseStatusBadge status={selectedResponse.status} />
              </div>

              <div className="min-h-0 flex-1">
                <ResponseDetailPane
                  selectedId={selectedResponse.id}
                  selectedMeta={selectedResponse}
                  compact
                  hideHeader
                />
              </div>
            </>
          ) : (
            <ResponseListPane
              items={items}
              totalCount={totalCount}
              selectedId={selectedResponse?.id ?? null}
              isLoading={showLoading}
              hasLoaded={hasLoaded}
              startIndex={startIndex}
              page={filters.page}
              totalPages={totalPages}
              onSelect={handleSelect}
              onPageChange={setPage}
            />
          )}
        </div>
      )}
    </div>
  );
}
