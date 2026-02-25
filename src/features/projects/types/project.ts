import type { Tables } from '@/lib/supabase/types';

// ── Enum tuples (source of truth, matching DB CHECK constraints) ────

/** All supported project contexts as a const tuple (source of truth). */
export const PROJECT_CONTEXTS = ['idea_validation', 'custom'] as const;

export type ProjectContext = (typeof PROJECT_CONTEXTS)[number];

/** All research phases for idea_validation projects (source of truth). */
export const RESEARCH_PHASES = [
  'problem_discovery',
  'solution_validation',
  'market_validation',
  'launch_readiness',
] as const;

export type ResearchPhase = (typeof RESEARCH_PHASES)[number];

/** All insight types as a const tuple (source of truth). */
export const INSIGHT_TYPES = ['strength', 'opportunity', 'threat', 'decision'] as const;

export type InsightType = (typeof INSIGHT_TYPES)[number];

/** All project lifecycle statuses as a const tuple (source of truth). */
export const PROJECT_STATUSES = ['active', 'archived'] as const;

export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

// ── Finding types (auto-generated from survey data) ─────────────────

/** Source of the auto-finding — which analysis produced it. */
export const FINDING_SOURCES = ['yes_no', 'rating', 'multiple_choice', 'completion_rate'] as const;
export type FindingSource = (typeof FINDING_SOURCES)[number];

/** An auto-generated finding derived from quantitative survey data. */
export interface Finding {
  source: FindingSource;
  phase: ResearchPhase | null;
  questionText?: string;
  surveyTitle?: string;
  value: number;
  detail?: string;
}

// ── Row types (from DB) ─────────────────────────────────────────────

export type Project = Tables<'projects'>;
export type ProjectInsight = Tables<'project_insights'>;
