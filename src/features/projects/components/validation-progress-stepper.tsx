'use client';

import { Check } from 'lucide-react';
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

interface ValidationProgressStepperProps {
  phaseStatuses: Record<ResearchPhase, PhaseStatus>;
}

export function ValidationProgressStepper({ phaseStatuses }: ValidationProgressStepperProps) {
  const t = useTranslations();

  return (
    <TooltipProvider>
      <div
        className="flex items-start gap-0"
        role="list"
        aria-label={t('projects.detail.progress')}
      >
        {RESEARCH_PHASES.map((phase, index) => {
          const config = RESEARCH_PHASE_CONFIG[phase];
          const status = phaseStatuses[phase];
          const Icon = config.icon;
          const isLast = index === RESEARCH_PHASES.length - 1;
          const lineColored = status === 'validated';

          return (
            <div key={phase} className="flex min-w-0 flex-1 items-start" role="listitem">
              {/* Phase step */}
              <div className="flex flex-col items-center gap-1.5">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className={cn(
                        'flex size-9 shrink-0 items-center justify-center rounded-full border-2 transition-colors md:size-10',
                        status === 'validated' &&
                          'border-emerald-500 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
                        status === 'in_progress' &&
                          'border-amber-500 bg-amber-500/15 text-amber-700 dark:text-amber-400',
                        status === 'not_started' &&
                          'border-border bg-muted/50 text-muted-foreground'
                      )}
                    >
                      {status === 'validated' ? (
                        <Check className="size-4 md:size-5" aria-hidden />
                      ) : (
                        <Icon className="size-4 md:size-5" aria-hidden />
                      )}
                    </div>
                  </TooltipTrigger>

                  <TooltipContent side="bottom">
                    {t(config.labelKey as MessageKey)}: {t(STATUS_LABEL_KEYS[status])}
                  </TooltipContent>
                </Tooltip>

                <span className="text-foreground hidden text-center text-xs font-medium md:block">
                  {t(config.labelKey as MessageKey)}
                </span>

                <span
                  className={cn(
                    'hidden rounded-full px-2 py-0.5 text-[10px] font-medium md:block',
                    status === 'validated' &&
                      'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
                    status === 'in_progress' &&
                      'bg-amber-500/15 text-amber-700 dark:text-amber-400',
                    status === 'not_started' && 'bg-muted text-muted-foreground'
                  )}
                >
                  {t(STATUS_LABEL_KEYS[status])}
                </span>
              </div>

              {!isLast && (
                <div className="mt-[16px] flex flex-1 items-center px-1.5 md:mt-[18px] md:px-2">
                  <div
                    className={cn(
                      'h-0.5 w-full rounded-full transition-colors',
                      lineColored ? 'bg-emerald-500' : 'bg-border'
                    )}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
