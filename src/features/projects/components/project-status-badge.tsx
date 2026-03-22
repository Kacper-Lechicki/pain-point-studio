import { StatusBadge } from '@/components/ui/status-badge';
import { PROJECT_TRASH_RETENTION_DAYS } from '@/features/projects/config/constraints';
import { PROJECT_STATUS_CONFIG } from '@/features/projects/config/status';
import type { ProjectStatus } from '@/features/projects/types';

interface ProjectStatusBadgeProps {
  status: ProjectStatus;
  className?: string;
}

export function ProjectStatusBadge({ status, className }: ProjectStatusBadgeProps) {
  const config = PROJECT_STATUS_CONFIG[status];

  return (
    <StatusBadge
      labelKey={config.labelKey}
      descriptionKey={config.descriptionKey}
      ariaLabelKey={config.ariaLabelKey}
      variant={config.badge.variant}
      badgeClassName={config.badge.className}
      className={className}
      {...(status === 'trashed' && {
        descriptionValues: { days: PROJECT_TRASH_RETENTION_DAYS },
      })}
    />
  );
}
