'use client';

import { useTranslations } from 'next-intl';

import { Badge } from '@/components/ui/badge';
import { PHASE_CONFIG } from '@/features/projects/config/phases';
import type { ResearchPhase } from '@/features/projects/types';
import type { MessageKey } from '@/i18n/types';

interface ProjectPhaseBadgeProps {
  phase: ResearchPhase;
}

export function ProjectPhaseBadge({ phase }: ProjectPhaseBadgeProps) {
  const t = useTranslations();
  const config = PHASE_CONFIG[phase];

  return (
    <Badge variant="outline" className={config.colors.badge}>
      {t(config.labelKey as MessageKey)}
    </Badge>
  );
}
