'use client';

import { useTranslations } from 'next-intl';

import {
  DEVICE_ICONS,
  formatDuration,
  formatRelativeTime,
} from '@/features/surveys/lib/response-formatting';
import type { SurveyResponseListItem } from '@/features/surveys/types/response-list';
import { cn } from '@/lib/common/utils';

import { ResponseStatusBadge } from './response-status-badge';

interface ResponseListItemProps {
  item: SurveyResponseListItem;
  index: number;
  isActive: boolean;
  onClick: () => void;
}

export function ResponseListItem({ item, index, isActive, onClick }: ResponseListItemProps) {
  const t = useTranslations('surveys.stats.responseList');
  const DeviceIcon = item.deviceType ? DEVICE_ICONS[item.deviceType] : null;

  return (
    <div
      role="button"
      tabIndex={0}
      className={cn(
        'border-border/50 flex w-full cursor-pointer flex-col gap-1.5 border-b px-3 py-2.5 text-left transition-colors',
        'hover:bg-primary/[0.04]',
        isActive && 'border-l-primary bg-primary/[0.06] border-l-2'
      )}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      aria-label={`${t('detailTitle')} #${index + 1}`}
      aria-current={isActive ? 'true' : undefined}
    >
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground text-xs font-semibold tabular-nums">
          #{index + 1}
        </span>

        <ResponseStatusBadge status={item.status} />
      </div>

      <div className="text-muted-foreground flex items-center gap-1 text-[11px]">
        <span>{formatRelativeTime(item.completedAt ?? item.startedAt)}</span>

        {item.deviceType && DeviceIcon && (
          <>
            <span aria-hidden="true">&middot;</span>
            <DeviceIcon className="size-3" />
            <span>{t(`device_${item.deviceType}`)}</span>
          </>
        )}

        <span aria-hidden="true">&middot;</span>
        <span>{formatDuration(item.durationSeconds)}</span>
      </div>
    </div>
  );
}
