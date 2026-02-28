'use client';

import { useTranslations } from 'next-intl';

import { StatusBadge } from '@/components/ui/status-badge';
import type { SmartStatus, SmartStatusType } from '@/features/projects/lib/smart-status';
import type { MessageKey } from '@/i18n/types';

const STATUS_STYLES: Record<SmartStatusType, string> = {
  survey_ending_soon: 'border-amber-500/25 bg-amber-500/15 text-amber-700 dark:text-amber-400',
  no_active_surveys: 'border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-400',
  has_drafts: 'border-blue-500/25 bg-blue-500/15 text-blue-700 dark:text-blue-400',
  collecting_responses:
    'border-emerald-500/25 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
  no_surveys: 'border-border bg-muted/50 text-muted-foreground',
  all_complete: 'border-border bg-muted/50 text-muted-foreground',
};

/** Smart status types whose i18n label requires ICU params. */
const NEEDS_PARAMS = new Set<SmartStatusType>(['survey_ending_soon', 'has_drafts']);

interface SmartStatusBadgeProps {
  status: SmartStatus;
  className?: string | undefined;
}

export function SmartStatusBadge({ status, className }: SmartStatusBadgeProps) {
  const t = useTranslations();

  const labelKey = `projects.list.smartStatus.${status.type}` as MessageKey;
  const descriptionKey = `projects.list.smartStatus.description.${status.type}` as MessageKey;
  const label = status.meta != null ? t(labelKey, { count: status.meta }) : t(labelKey);

  return (
    <StatusBadge
      labelKey={labelKey}
      descriptionKey={descriptionKey}
      ariaLabelKey="projects.list.smartStatus.ariaLabel"
      variant="outline"
      badgeClassName={`whitespace-nowrap ${STATUS_STYLES[status.type]}`}
      labelOverride={label}
      dialogLabel={NEEDS_PARAMS.has(status.type) ? label : undefined}
      className={className}
    />
  );
}
