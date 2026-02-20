'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PER_PAGE_OPTIONS, type PerPage } from '@/hooks/common/use-pagination';

interface ListPaginationProps {
  page: number;
  totalPages: number;
  perPage: PerPage;
  totalItems: number;
  startIndex: number;
  endIndex: number;
  canGoNext: boolean;
  canGoPrev: boolean;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: PerPage) => void;
  onNextPage: () => void;
  onPrevPage: () => void;
}

export const ListPagination = ({
  perPage,
  totalItems,
  startIndex,
  endIndex,
  canGoNext,
  canGoPrev,
  onPerPageChange,
  onNextPage,
  onPrevPage,
}: ListPaginationProps) => {
  const t = useTranslations();

  if (totalItems === 0) {
    return null;
  }

  return (
    <nav aria-label="Pagination" className="flex flex-wrap items-center justify-between gap-3 pt-2">
      <p className="text-muted-foreground text-xs tabular-nums">
        {t('common.pagination.showing', {
          start: startIndex + 1,
          end: endIndex,
          total: totalItems,
        })}
      </p>

      <div className="flex items-center gap-2">
        <Select
          value={String(perPage)}
          onValueChange={(v) => onPerPageChange(Number(v) as PerPage)}
        >
          <SelectTrigger size="sm" className="w-auto gap-1 text-xs">
            <SelectValue />
          </SelectTrigger>

          <SelectContent align="end">
            {PER_PAGE_OPTIONS.map((opt) => (
              <SelectItem key={opt} value={String(opt)} className="text-xs">
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={onPrevPage}
            disabled={!canGoPrev}
            aria-label={t('common.pagination.previous')}
          >
            <ChevronLeft className="size-3.5" />
          </Button>

          <Button
            variant="ghost"
            size="icon-xs"
            onClick={onNextPage}
            disabled={!canGoNext}
            aria-label={t('common.pagination.next')}
          >
            <ChevronRight className="size-3.5" />
          </Button>
        </div>
      </div>
    </nav>
  );
};
