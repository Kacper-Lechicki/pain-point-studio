import { useTranslations } from 'next-intl';

import { Badge } from '@/components/ui/badge';
import { getStatusBadgeProps } from '@/features/surveys/config/survey-status';
import type { SurveyStatus } from '@/features/surveys/types';
import { cn } from '@/lib/common/utils';

interface SurveyStatusBadgeProps {
  status: SurveyStatus;
  className?: string;
}

export function SurveyStatusBadge({ status, className }: SurveyStatusBadgeProps) {
  const t = useTranslations();
  const { variant, className: badgeClass, showPulseDot } = getStatusBadgeProps(status);

  return (
    <Badge variant={variant} className={cn('text-[11px]', badgeClass, className)}>
      {showPulseDot && (
        <span className="relative mr-0.5 flex size-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex size-1.5 rounded-full bg-emerald-500" />
        </span>
      )}
      {t(`surveys.dashboard.status.${status}`)}
    </Badge>
  );
}
