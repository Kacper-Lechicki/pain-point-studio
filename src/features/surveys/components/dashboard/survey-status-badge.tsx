import { StatusBadge } from '@/components/ui/status-badge';
import { SURVEY_STATUS_CONFIG } from '@/features/surveys/config/survey-status';
import type { SurveyStatus } from '@/features/surveys/types';

interface SurveyStatusBadgeProps {
  status: SurveyStatus;
  className?: string;
}

export function SurveyStatusBadge({ status, className }: SurveyStatusBadgeProps) {
  const config = SURVEY_STATUS_CONFIG[status];

  return (
    <StatusBadge
      labelKey={config.labelKey}
      descriptionKey={config.descriptionKey}
      ariaLabelKey={config.ariaLabelKey}
      variant={config.badge.variant}
      badgeClassName={config.badge.className}
      showPulseDot={config.badge.showPulseDot}
      className={className}
    />
  );
}
