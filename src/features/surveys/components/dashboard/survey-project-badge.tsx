import { FolderKanban } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Badge } from '@/components/ui/badge';
import { ROUTES } from '@/config/routes';
import { RESEARCH_PHASE_CONFIG } from '@/features/projects/config/contexts';
import type { ResearchPhase } from '@/features/projects/types';
import Link from '@/i18n/link';
import type { MessageKey } from '@/i18n/types';

interface SurveyProjectBadgeProps {
  projectId: string | null;
  projectName: string | null;
  projectContext: string | null;
  researchPhase: string | null;
}

export function SurveyProjectBadge({
  projectId,
  projectName,
  projectContext,
  researchPhase,
}: SurveyProjectBadgeProps) {
  const t = useTranslations();

  if (!projectId || !projectName) {
    return null;
  }

  const phaseConfig =
    projectContext === 'idea_validation' && researchPhase
      ? RESEARCH_PHASE_CONFIG[researchPhase as ResearchPhase]
      : null;

  const PhaseIcon = phaseConfig?.icon;

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-1">
      <Badge variant="secondary" className="max-w-full gap-1 px-1.5 py-0 text-[11px]" asChild>
        <Link
          href={`${ROUTES.dashboard.projectDetail}/${projectId}`}
          onClick={(e) => e.stopPropagation()}
        >
          <FolderKanban className="!size-3 shrink-0" aria-hidden />
          <span className="truncate">{projectName}</span>
        </Link>
      </Badge>

      {phaseConfig && PhaseIcon && (
        <Badge variant="outline" className="gap-1 px-1.5 py-0 text-[11px]">
          <PhaseIcon className="!size-3 shrink-0" aria-hidden />
          <span className="truncate">{t(phaseConfig.labelKey as MessageKey)}</span>
        </Badge>
      )}
    </div>
  );
}
