'use client';

import { StatusBadge } from '@/components/ui/status-badge';
import { PHASE_CONFIG } from '@/features/projects/config/phases';
import type { ResearchPhase } from '@/features/projects/types';

interface ProjectPhaseBadgeProps {
  phase: ResearchPhase;
  className?: string;
}

export function ProjectPhaseBadge({ phase, className }: ProjectPhaseBadgeProps) {
  const config = PHASE_CONFIG[phase];

  return (
    <StatusBadge
      labelKey={config.labelKey}
      descriptionKey={config.descriptionKey}
      ariaLabelKey={config.ariaLabelKey}
      variant="outline"
      badgeClassName={config.colors.badge}
      className={className}
    />
  );
}
