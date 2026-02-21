import { Lightbulb, Rocket, Search, TrendingUp } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import type { ProjectContext, ResearchPhase } from '@/features/projects/types';

// ── Phase config ────────────────────────────────────────────────────

export type PhaseConfig = {
  value: ResearchPhase;
  labelKey: string;
  icon: LucideIcon;
};

/** Config for each research phase: label, icon. */
export const RESEARCH_PHASE_CONFIG: Record<ResearchPhase, PhaseConfig> = {
  problem_discovery: {
    value: 'problem_discovery',
    labelKey: 'projects.phases.problemDiscovery',
    icon: Search,
  },
  solution_validation: {
    value: 'solution_validation',
    labelKey: 'projects.phases.solutionValidation',
    icon: Lightbulb,
  },
  market_validation: {
    value: 'market_validation',
    labelKey: 'projects.phases.marketValidation',
    icon: TrendingUp,
  },
  launch_readiness: {
    value: 'launch_readiness',
    labelKey: 'projects.phases.launchReadiness',
    icon: Rocket,
  },
};

// ── Context config ──────────────────────────────────────────────────

export type ContextConfig = {
  value: ProjectContext;
  labelKey: string;
  phases: PhaseConfig[];
};

/** Config for each project context: label, associated phases. */
export const PROJECT_CONTEXTS_CONFIG: Record<ProjectContext, ContextConfig> = {
  idea_validation: {
    value: 'idea_validation',
    labelKey: 'projects.contexts.ideaValidation',
    phases: [
      RESEARCH_PHASE_CONFIG.problem_discovery,
      RESEARCH_PHASE_CONFIG.solution_validation,
      RESEARCH_PHASE_CONFIG.market_validation,
      RESEARCH_PHASE_CONFIG.launch_readiness,
    ],
  },
  custom: {
    value: 'custom',
    labelKey: 'projects.contexts.customResearch',
    phases: [],
  },
};
