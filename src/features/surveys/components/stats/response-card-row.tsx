'use client';

import { Clock, Mail, Monitor, Smartphone, Tablet } from 'lucide-react';
import { useTranslations } from 'next-intl';

import type { DeviceType, SurveyResponseListItem } from '@/features/surveys/types/response-list';

import { ResponseStatusBadge } from './response-status-badge';

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

interface ResponseCardRowProps {
  item: SurveyResponseListItem;
  index: number;
  onRowClick: (response: SurveyResponseListItem) => void;
}

export function ResponseCardRow({ item, index, onRowClick }: ResponseCardRowProps) {
  const t = useTranslations('surveys.stats.responseList');
  const DeviceIcon = item.deviceType ? DEVICE_ICONS[item.deviceType] : null;

  return (
    <div
      className="border-border/50 bg-card flex min-w-0 cursor-pointer flex-col gap-3 rounded-lg border p-3 transition-all"
      onClick={() => onRowClick(item)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onRowClick(item);
        }
      }}
      aria-label={`${t('detailTitle')} #${index + 1}`}
    >
      <div className="flex min-w-0 items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="text-muted-foreground text-xs font-medium tabular-nums">
            #{index + 1}
          </span>
          <ResponseStatusBadge status={item.status} />
        </div>

        {item.contactEmail && <Mail className="text-muted-foreground size-3.5 shrink-0" />}
      </div>

      <div className="text-muted-foreground grid min-w-0 grid-cols-3 gap-x-4 text-xs">
        <div className="flex flex-col gap-0.5">
          <span>{t('colCompleted')}</span>
          <span className="text-foreground font-medium tabular-nums">
            {formatRelativeTime(item.completedAt ?? item.startedAt)}
          </span>
        </div>

        <div className="flex flex-col gap-0.5">
          <span>{t('colDuration')}</span>
          <span className="text-foreground flex items-center gap-1 font-medium tabular-nums">
            <Clock className="size-3" />
            {formatDuration(item.durationSeconds)}
          </span>
        </div>

        <div className="flex flex-col gap-0.5">
          <span>{t('colDevice')}</span>
          {item.deviceType && DeviceIcon ? (
            <span className="text-foreground flex items-center gap-1 font-medium">
              <DeviceIcon className="size-3.5" />
              <span>{t(`device_${item.deviceType}`)}</span>
            </span>
          ) : (
            <span className="text-foreground font-medium">—</span>
          )}
        </div>
      </div>
    </div>
  );
}
