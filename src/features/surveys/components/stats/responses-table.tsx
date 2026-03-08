'use client';

import type React from 'react';

import { Clock, Mail, Monitor, Smartphone, Tablet } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Skeleton } from '@/components/ui/skeleton';
import { SortableTableHeader } from '@/components/ui/sortable-table-header';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type {
  DeviceType,
  ResponseSortBy,
  SortDirection,
  SurveyResponseListItem,
} from '@/features/surveys/types/response-list';
import { cn } from '@/lib/common/utils';

import { ResponseStatusBadge } from './response-status-badge';

interface ResponsesTableProps {
  items: SurveyResponseListItem[];
  isLoading: boolean;
  onRowClick: (response: SurveyResponseListItem) => void;
  sortBy: ResponseSortBy;
  sortDir: SortDirection;
  onSortByColumn: (key: ResponseSortBy) => void;
}

const DEVICE_ICONS: Record<DeviceType, typeof Monitor> = {
  desktop: Monitor,
  mobile: Smartphone,
  tablet: Tablet,
};

function formatDuration(seconds: number | null): string {
  if (seconds == null) {
    return '—';
  }

  if (seconds < 60) {
    return `${Math.round(seconds)}s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);

  if (minutes < 60) {
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}

function formatRelativeTime(dateStr: string | null): string {
  if (!dateStr) {
    return '—';
  }

  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (diffMinutes < 1) {
    return 'just now';
  }

  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }

  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  if (diffDays < 30) {
    return `${diffDays}d ago`;
  }

  return date.toLocaleDateString();
}

function TableSkeleton({ t }: { t: ReturnType<typeof useTranslations> }) {
  return (
    <div className="border-border/50 bg-card overflow-hidden rounded-lg border">
      <Table className="table-fixed">
        <TableHeader>
          <TableRow className="bg-muted/60 md:hover:bg-muted/60">
            <TableHead className="w-12 min-w-0 px-4 py-3">#</TableHead>
            <TableHead className="border-border/30 min-w-0 border-l px-4 py-3 text-center">
              {t('colStatus')}
            </TableHead>
            <TableHead className="border-border/30 min-w-0 border-l px-4 py-3">
              {t('colCompleted')}
            </TableHead>
            <TableHead className="border-border/30 hidden min-w-0 border-l px-4 py-3 sm:table-cell">
              {t('colDevice')}
            </TableHead>
            <TableHead className="border-border/30 hidden min-w-0 border-l px-4 py-3 sm:table-cell">
              {t('colDuration')}
            </TableHead>
            <TableHead className="w-12 shrink-0 py-3" aria-hidden />
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }).map((_, i) => (
            <TableRow key={i} className="even:bg-muted/30 h-14">
              <TableCell className="min-w-0 px-4 py-3">
                <Skeleton className="h-4 w-6" />
              </TableCell>
              <TableCell className="border-border/30 min-w-0 border-l px-4 py-3 text-center">
                <Skeleton className="mx-auto h-5 w-20" />
              </TableCell>
              <TableCell className="border-border/30 min-w-0 border-l px-4 py-3">
                <Skeleton className="h-4 w-16" />
              </TableCell>
              <TableCell className="border-border/30 hidden min-w-0 border-l px-4 py-3 sm:table-cell">
                <Skeleton className="h-4 w-16" />
              </TableCell>
              <TableCell className="border-border/30 hidden min-w-0 border-l px-4 py-3 sm:table-cell">
                <Skeleton className="h-4 w-12" />
              </TableCell>
              <TableCell className="py-3">
                <Skeleton className="mx-auto size-4" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function ResponsesTable({
  items,
  isLoading,
  onRowClick,
  sortBy,
  sortDir,
  onSortByColumn,
}: ResponsesTableProps) {
  const t = useTranslations('surveys.stats.responseList');

  if (isLoading && items.length === 0) {
    return <TableSkeleton t={t} />;
  }

  if (items.length === 0) {
    return (
      <div className="border-border/50 text-muted-foreground rounded-lg border py-12 text-center text-sm">
        {t('noResults')}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'border-border/50 bg-card overflow-hidden rounded-lg border transition-opacity',
        isLoading && 'opacity-60'
      )}
    >
      <Table className="table-fixed">
        <TableHeader>
          <TableRow className="bg-muted/60 md:hover:bg-muted/60">
            <TableHead className="w-12 min-w-0 px-4 py-3">#</TableHead>

            <TableHead className="border-border/30 min-w-0 border-l px-4 py-3 text-center">
              {t('colStatus')}
            </TableHead>

            <SortableTableHeader
              sortKey="completed_at"
              currentSortKey={sortBy}
              sortDir={sortDir}
              onSort={onSortByColumn}
              label={t('colCompleted')}
              className="border-border/30 min-w-0 border-l px-4 py-3"
            />

            <TableHead className="border-border/30 hidden min-w-0 border-l px-4 py-3 sm:table-cell">
              {t('colDevice')}
            </TableHead>

            <SortableTableHeader
              sortKey="duration"
              currentSortKey={sortBy}
              sortDir={sortDir}
              onSort={onSortByColumn}
              label={t('colDuration')}
              className="border-border/30 hidden min-w-0 border-l px-4 py-3 sm:table-cell"
            />

            <TableHead className="w-12 shrink-0 py-3" aria-hidden />
          </TableRow>
        </TableHeader>

        <TableBody>
          {items.map((item, index) => {
            const DeviceIcon = item.deviceType ? DEVICE_ICONS[item.deviceType] : null;

            const rowInteraction = {
              onClick: () => {
                if (document.querySelector('[data-slot="dialog-overlay"]')) {
                  return;
                }

                onRowClick(item);
              },
              role: 'button' as const,
              tabIndex: 0,
              onKeyDown: (e: React.KeyboardEvent) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onRowClick(item);
                }
              },
              'aria-label': `${t('detailTitle')} #${index + 1}`,
            };

            return (
              <TableRow
                key={item.id}
                className="even:bg-muted/30 h-14 cursor-pointer transition-all"
                {...rowInteraction}
              >
                <TableCell className="text-muted-foreground min-w-0 px-4 py-3 tabular-nums">
                  {index + 1}
                </TableCell>

                <TableCell className="border-border/30 min-w-0 border-l px-4 py-3 text-center">
                  <ResponseStatusBadge status={item.status} />
                </TableCell>

                <TableCell className="text-muted-foreground border-border/30 min-w-0 border-l px-4 py-3 text-xs">
                  {formatRelativeTime(item.completedAt ?? item.startedAt)}
                </TableCell>

                <TableCell className="border-border/30 hidden min-w-0 border-l px-4 py-3 sm:table-cell">
                  {item.deviceType && DeviceIcon && (
                    <div className="text-muted-foreground flex items-center gap-1.5">
                      <DeviceIcon className="size-3.5" />
                      <span className="text-xs">{t(`device_${item.deviceType}`)}</span>
                    </div>
                  )}
                </TableCell>

                <TableCell className="border-border/30 hidden min-w-0 border-l px-4 py-3 text-xs tabular-nums sm:table-cell">
                  <div className="text-muted-foreground flex items-center gap-1">
                    <Clock className="size-3" />
                    {formatDuration(item.durationSeconds)}
                  </div>
                </TableCell>

                <TableCell className="w-12 shrink-0 py-3">
                  {item.contactEmail && (
                    <div className="flex items-center justify-center">
                      <Mail className="text-muted-foreground size-3.5" />
                    </div>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
