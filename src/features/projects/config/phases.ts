import { FlaskConical, Lightbulb, Scale, Search } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import type { ResearchPhase } from '@/features/projects/types';

export interface PhaseConfig {
  labelKey: string;
  descriptionKey: string;
  icon: LucideIcon;
  colors: {
    bg: string;
    icon: string;
    text: string;
    badge: string;
  };
}

/** Visual configuration for each research phase. */
export const PHASE_CONFIG: Record<ResearchPhase, PhaseConfig> = {
  idea: {
    labelKey: 'projects.phases.idea',
    descriptionKey: 'projects.phases.ideaDescription',
    icon: Lightbulb,
    colors: {
      bg: 'bg-amber-50 dark:bg-amber-950/30',
      icon: 'text-amber-600 dark:text-amber-400',
      text: 'text-amber-900 dark:text-amber-100',
      badge: 'border-amber-500/25 bg-amber-500/15 text-amber-700 dark:text-amber-400',
    },
  },
  research: {
    labelKey: 'projects.phases.research',
    descriptionKey: 'projects.phases.researchDescription',
    icon: Search,
    colors: {
      bg: 'bg-sky-50 dark:bg-sky-950/30',
      icon: 'text-sky-600 dark:text-sky-400',
      text: 'text-sky-900 dark:text-sky-100',
      badge: 'border-sky-500/25 bg-sky-500/15 text-sky-700 dark:text-sky-400',
    },
  },
  validation: {
    labelKey: 'projects.phases.validation',
    descriptionKey: 'projects.phases.validationDescription',
    icon: FlaskConical,
    colors: {
      bg: 'bg-violet-50 dark:bg-violet-950/30',
      icon: 'text-violet-600 dark:text-violet-400',
      text: 'text-violet-900 dark:text-violet-100',
      badge: 'border-violet-500/25 bg-violet-500/15 text-violet-700 dark:text-violet-400',
    },
  },
  decision: {
    labelKey: 'projects.phases.decision',
    descriptionKey: 'projects.phases.decisionDescription',
    icon: Scale,
    colors: {
      bg: 'bg-emerald-50 dark:bg-emerald-950/30',
      icon: 'text-emerald-600 dark:text-emerald-400',
      text: 'text-emerald-900 dark:text-emerald-100',
      badge: 'border-emerald-500/25 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
    },
  },
};
