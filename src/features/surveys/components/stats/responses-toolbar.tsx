'use client';

import type { ReactNode } from 'react';
import { useState } from 'react';

import { format } from 'date-fns';
import { CalendarIcon, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { DateRange } from 'react-day-picker';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { type FilterGroup, ListToolbar } from '@/components/ui/list-toolbar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type {
  DeviceType,
  ResponseListFilters,
  ResponseSortBy,
  ResponseStatus,
  SortDirection,
} from '@/features/surveys/types/response-list';
import { cn } from '@/lib/common/utils';

interface ResponsesToolbarProps {
  filters: ResponseListFilters;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: ResponseStatus | undefined) => void;
  onDeviceChange: (value: DeviceType | undefined) => void;
  onHasContactChange: (value: boolean | undefined) => void;
  onDateRangeChange: (dateFrom: string | undefined, dateTo: string | undefined) => void;
  onSortChange: (sortBy: ResponseSortBy, sortDir: SortDirection) => void;
  onClearFilters: () => void;
  actions?: ReactNode;
}

function DateRangePicker({
  dateFrom,
  dateTo,
  onChange,
}: {
  dateFrom: string | undefined;
  dateTo: string | undefined;
  onChange: (dateFrom: string | undefined, dateTo: string | undefined) => void;
}) {
  const t = useTranslations('surveys.stats.responseList');
  const [open, setOpen] = useState(false);

  const fromDate = dateFrom ? new Date(dateFrom) : undefined;
  const toDate = dateTo ? new Date(dateTo) : undefined;

  const selected: DateRange | undefined =
    fromDate || toDate ? { from: fromDate, to: toDate } : undefined;

  const hasRange = !!dateFrom || !!dateTo;

  function handleSelect(range: DateRange | undefined) {
    if (!range) {
      onChange(undefined, undefined);

      return;
    }

    const from = range.from ? range.from.toISOString() : undefined;
    const to = range.to
      ? new Date(
          range.to.getFullYear(),
          range.to.getMonth(),
          range.to.getDate(),
          23,
          59,
          59,
          999
        ).toISOString()
      : undefined;

    onChange(from, to);
  }

  function formatLabel(): string {
    if (fromDate && toDate) {
      return `${format(fromDate, 'MMM d')} – ${format(toDate, 'MMM d, yyyy')}`;
    }

    if (fromDate) {
      return `${format(fromDate, 'MMM d, yyyy')} –`;
    }

    return t('dateRange');
  }

  return (
    <div className="flex items-center gap-1">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant={hasRange ? 'secondary' : 'outline'}
            className={cn('shrink-0 gap-1.5', hasRange && 'pr-1.5')}
          >
            <CalendarIcon className="size-4" />
            <span className={cn('text-xs', !hasRange && 'hidden sm:inline')}>{formatLabel()}</span>
            {hasRange && (
              <span
                role="button"
                tabIndex={0}
                className="text-muted-foreground hover:text-foreground ml-0.5 rounded-sm p-0.5 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(undefined, undefined);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    e.stopPropagation();
                    onChange(undefined, undefined);
                  }
                }}
                aria-label={t('clearDateRange')}
              >
                <X className="size-3" />
              </span>
            )}
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-auto p-0" align="end" collisionPadding={8}>
          <Calendar
            mode="range"
            selected={selected}
            onSelect={handleSelect}
            numberOfMonths={2}
            disabled={{ after: new Date() }}
            defaultMonth={fromDate ?? new Date()}
            className="p-2 [--cell-size:--spacing(7)] [&_.rdp-month]:gap-2 [&_.rdp-nav]:h-(--cell-size) [&_.rdp-week]:mt-0.5"
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

export function ResponsesToolbar({
  filters,
  onSearchChange,
  onStatusChange,
  onDeviceChange,
  onHasContactChange,
  onDateRangeChange,
  onSortChange,
  actions,
}: ResponsesToolbarProps) {
  const t = useTranslations('surveys.stats.responseList');

  const statusGroup: FilterGroup = {
    label: t('filterStatus'),
    options: [
      { value: 'completed', label: t('statusCompleted') },
      { value: 'in_progress', label: t('statusInProgress') },
      { value: 'abandoned', label: t('statusAbandoned') },
    ],
    selected: filters.status ? [filters.status] : [],
    onChange: (selected) => {
      onStatusChange(selected.length > 0 ? (selected[0] as ResponseStatus) : undefined);
    },
  };

  const deviceGroup: FilterGroup = {
    label: t('filterDevice'),
    options: [
      { value: 'desktop', label: t('deviceDesktop') },
      { value: 'mobile', label: t('deviceMobile') },
      { value: 'tablet', label: t('deviceTablet') },
    ],
    selected: filters.device ? [filters.device] : [],
    onChange: (selected) => {
      onDeviceChange(selected.length > 0 ? (selected[0] as DeviceType) : undefined);
    },
  };

  const contactGroup: FilterGroup = {
    label: t('filterContact'),
    options: [
      { value: 'with', label: t('contactWith') },
      { value: 'without', label: t('contactWithout') },
    ],
    selected:
      filters.hasContact === true ? ['with'] : filters.hasContact === false ? ['without'] : [],
    onChange: (selected) => {
      if (selected.length === 0) {
        onHasContactChange(undefined);
      } else if (selected[0] === 'with') {
        onHasContactChange(true);
      } else {
        onHasContactChange(false);
      }
    },
  };

  const sortOptions: { value: ResponseSortBy; label: string }[] = [
    { value: 'completed_at', label: t('sortCompletedAt') },
    { value: 'started_at', label: t('sortStartedAt') },
    { value: 'duration', label: t('sortDuration') },
  ];

  const dateRangePicker = (
    <DateRangePicker
      dateFrom={filters.dateFrom}
      dateTo={filters.dateTo}
      onChange={onDateRangeChange}
    />
  );

  return (
    <ListToolbar
      searchQuery={filters.search ?? ''}
      onSearchQueryChange={onSearchChange}
      searchPlaceholder={t('searchPlaceholder')}
      filterGroups={[statusGroup, deviceGroup, contactGroup]}
      filterLabel={t('filterLabel')}
      clearFiltersLabel={t('clearFilters')}
      sortBy={filters.sortBy}
      sortDir={filters.sortDir}
      onSortByChange={(sortBy) => onSortChange(sortBy, filters.sortDir)}
      onSortDirChange={(dir) => onSortChange(filters.sortBy, dir)}
      sortOptions={sortOptions}
      sortDirLabels={{ asc: t('sortAsc'), desc: t('sortDesc') }}
      sortLabel={t('sortLabel')}
      actions={
        <>
          {dateRangePicker}
          {actions}
        </>
      }
    />
  );
}
