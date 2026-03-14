import { StatusBadge } from '@/components/ui/status-badge';
import { TRASH_RETENTION_DAYS } from '@/features/surveys/config';
import { SURVEY_STATUS_CONFIG } from '@/features/surveys/config/survey-status';
import type { SurveyStatus } from '@/features/surveys/types';
import { daysUntilExpiry } from '@/lib/common/calculations';

interface SurveyStatusBadgeProps {
  status: SurveyStatus;
  /** When status is trashed, pass deletedAt so the description can show days until purge. */
  deletedAt?: string | null;
  className?: string;
}

export function SurveyStatusBadge({ status, deletedAt, className }: SurveyStatusBadgeProps) {
  const config = SURVEY_STATUS_CONFIG[status];

  const descriptionValues = (() => {
    if (status !== 'trashed') {
      return undefined;
    }

    const days = daysUntilExpiry(deletedAt ?? null, TRASH_RETENTION_DAYS);

    return { days: days ?? TRASH_RETENTION_DAYS };
  })();

  return (
    <StatusBadge
      labelKey={config.labelKey}
      descriptionKey={config.descriptionKey}
      ariaLabelKey={config.ariaLabelKey}
      variant={config.badge.variant}
      badgeClassName={config.badge.className}
      showPulseDot={config.badge.showPulseDot}
      className={className}
      descriptionValues={descriptionValues}
    />
  );
}
