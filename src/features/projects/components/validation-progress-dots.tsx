'use client';

import { useTranslations } from 'next-intl';

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { RESEARCH_PHASE_CONFIG } from '@/features/projects/config/contexts';
import type { PhaseStatus } from '@/features/projects/lib/phase-status';
import type { ResearchPhase } from '@/features/projects/types';
import { RESEARCH_PHASES } from '@/features/projects/types';
import type { MessageKey } from '@/i18n/types';
import { cn } from '@/lib/common/utils';

const STATUS_LABEL_KEYS: Record<PhaseStatus, MessageKey> = {
  not_started: 'projects.validation.notStarted' as MessageKey,
  in_progress: 'projects.validation.inProgress' as MessageKey,
  validated: 'projects.validation.validated' as MessageKey,
};

interface ValidationProgressDotsProps {
  phaseStatuses: Record<ResearchPhase, PhaseStatus>;
}

export function ValidationProgressDots({ phaseStatuses }: ValidationProgressDotsProps) {
  const t = useTranslations();

  return (
    <TooltipProvider>
      <div className="flex items-center gap-0" aria-label={t('projects.detail.progress')}>
        {RESEARCH_PHASES.map((phase, index) => {
          const config = RESEARCH_PHASE_CONFIG[phase];
          const status = phaseStatuses[phase];
          const isLast = index === RESEARCH_PHASES.length - 1;

          return (
            <div key={phase} className="flex items-center">
              <Tooltip>
                <TooltipTrigger asChild>
                  <span
                    className={cn(
                      'block size-2 shrink-0 rounded-full',
                      status === 'validated' && 'bg-emerald-500',
                      status === 'in_progress' && 'bg-amber-500',
                      status === 'not_started' && 'bg-muted-foreground/30'
                    )}
                    aria-label={`${t(config.labelKey as MessageKey)}: ${t(STATUS_LABEL_KEYS[status])}`}
                  />
                </TooltipTrigger>

                <TooltipContent side="bottom">
                  {t(config.labelKey as MessageKey)}: {t(STATUS_LABEL_KEYS[status])}
                </TooltipContent>
              </Tooltip>

              {!isLast && (
                <div
                  className={cn(
                    'h-0.5 w-1.5 shrink-0',
                    status === 'validated' ? 'bg-emerald-500' : 'bg-muted-foreground/20'
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
