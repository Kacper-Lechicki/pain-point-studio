'use client';

import { useTranslations } from 'next-intl';

import { INSIGHT_SOURCE_CONFIG } from '@/features/projects/config/insight-sources';
import type { InsightSource } from '@/features/projects/types';
import type { MessageKey } from '@/i18n/types';

interface InsightSourceBadgeProps {
  source: InsightSource;
}

export function InsightSourceBadge({ source }: InsightSourceBadgeProps) {
  const t = useTranslations();
  const config = INSIGHT_SOURCE_CONFIG[source];
  const Icon = config.icon;

  return (
    <div className="text-muted-foreground flex items-center gap-1">
      <Icon className="size-3" aria-hidden />
      <span className="text-[11px]">{t(config.label as MessageKey)}</span>
    </div>
  );
}
