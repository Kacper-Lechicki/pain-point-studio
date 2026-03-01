import { useTranslations } from 'next-intl';

import { StatusBadge } from '@/components/ui/status-badge';
import { SURVEY_STATUS_CONFIG } from '@/features/surveys/config/survey-status';
import type { SurveyStatus } from '@/features/surveys/types';
import type { MessageKey } from '@/i18n/types';

interface SurveyStatusCountBadgeProps {
  status: SurveyStatus;
  count: number;
  className?: string;
}

export function SurveyStatusCountBadge({ status, count, className }: SurveyStatusCountBadgeProps) {
  const t = useTranslations();
  const cfg = SURVEY_STATUS_CONFIG[status];
  const label = t(cfg.labelKey as MessageKey);

  return (
    <StatusBadge
      labelKey={cfg.labelKey}
      descriptionKey={cfg.descriptionKey}
      ariaLabelKey={cfg.ariaLabelKey}
      variant={cfg.badge.variant}
      badgeClassName={cfg.badge.className}
      showPulseDot={cfg.badge.showPulseDot}
      labelOverride={`${count} ${label}`}
      className={className}
    />
  );
}
