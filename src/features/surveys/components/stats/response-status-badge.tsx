import { StatusBadge } from '@/components/ui/status-badge';
import { RESPONSE_STATUS_CONFIG } from '@/features/surveys/config/response-status';
import type { ResponseStatus } from '@/features/surveys/types/response-list';

interface ResponseStatusBadgeProps {
  status: ResponseStatus;
  className?: string;
}

export function ResponseStatusBadge({ status, className }: ResponseStatusBadgeProps) {
  const config = RESPONSE_STATUS_CONFIG[status];

  return (
    <StatusBadge
      labelKey={config.labelKey}
      descriptionKey={config.descriptionKey}
      ariaLabelKey={config.ariaLabelKey}
      variant={config.badge.variant}
      badgeClassName={config.badge.className}
      className={className}
    />
  );
}
