'use client';

import { Clock } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { DEVICE_ICONS, formatDuration } from '@/features/surveys/lib/response-formatting';
import type { SurveyResponseListItem } from '@/features/surveys/types/response-list';

import { ResponseStatusBadge } from './response-status-badge';

interface ResponseDetailHeaderProps {
  meta: SurveyResponseListItem;
}

export function ResponseDetailHeader({ meta }: ResponseDetailHeaderProps) {
  const t = useTranslations('surveys.stats.responseList');
  const DeviceIcon = meta.deviceType ? DEVICE_ICONS[meta.deviceType] : null;

  return (
    <div className="border-border shrink-0 border-b px-5 py-4">
      <div className="flex items-center justify-between">
        <h2 className="text-[15px] font-semibold">{t('detailTitle')}</h2>
        <ResponseStatusBadge status={meta.status} />
      </div>

      <div className="text-muted-foreground mt-1.5 flex flex-wrap items-center gap-x-1.5 text-[11px]">
        {meta.completedAt && (
          <span className="tabular-nums">{new Date(meta.completedAt).toLocaleString()}</span>
        )}

        {meta.deviceType && DeviceIcon && (
          <>
            {meta.completedAt && <span aria-hidden="true">&middot;</span>}
            <span className="flex items-center gap-1">
              <DeviceIcon className="size-3" />
              {t(`device_${meta.deviceType}`)}
            </span>
          </>
        )}

        {meta.durationSeconds != null && (
          <>
            {(meta.completedAt || meta.deviceType) && <span aria-hidden="true">&middot;</span>}
            <span className="flex items-center gap-1 tabular-nums">
              <Clock className="size-3" />
              {formatDuration(meta.durationSeconds)}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
