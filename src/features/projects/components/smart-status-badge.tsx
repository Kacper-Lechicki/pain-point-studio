'use client';

import { useTranslations } from 'next-intl';

import { Badge } from '@/components/ui/badge';
import type { SmartStatus, SmartStatusType } from '@/features/projects/lib/smart-status';
import type { MessageKey } from '@/i18n/types';
import { cn } from '@/lib/common/utils';

const STATUS_STYLES: Record<SmartStatusType, string> = {
  survey_ending_soon: 'border-amber-500/25 bg-amber-500/15 text-amber-700 dark:text-amber-400',
  no_active_surveys: 'border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-400',
  has_drafts: 'border-blue-500/25 bg-blue-500/15 text-blue-700 dark:text-blue-400',
  collecting_responses:
    'border-emerald-500/25 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
  no_surveys: 'border-border bg-muted/50 text-muted-foreground',
  all_complete: 'border-border bg-muted/50 text-muted-foreground',
};

interface SmartStatusBadgeProps {
  status: SmartStatus;
  className?: string | undefined;
}

export function SmartStatusBadge({ status, className }: SmartStatusBadgeProps) {
  const t = useTranslations();

  const key = `projects.list.smartStatus.${status.type}` as MessageKey;
  const label = status.meta != null ? t(key, { count: status.meta }) : t(key);

  return (
    <Badge
      variant="outline"
      className={cn('text-[11px] whitespace-nowrap', STATUS_STYLES[status.type], className)}
    >
      {label}
    </Badge>
  );
}
