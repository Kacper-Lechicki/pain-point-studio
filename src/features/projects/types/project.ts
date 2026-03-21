import type { Tables } from '@/lib/supabase/types';

// ── Enum tuples (source of truth, matching DB CHECK constraints) ────

/** All insight types as a const tuple (source of truth). */
export const INSIGHT_TYPES = ['strength', 'opportunity', 'threat', 'decision'] as const;

export type InsightType = (typeof INSIGHT_TYPES)[number];

/** All insight source types as a const tuple (source of truth). */
export const INSIGHT_SOURCES = [
  'survey',
  'user_interview',
  'competitor_analysis',
  'market_research',
  'own_observation',
] as const;

export type InsightSource = (typeof INSIGHT_SOURCES)[number];

/** All project lifecycle statuses as a const tuple (source of truth). */
export const PROJECT_STATUSES = ['active', 'completed', 'archived', 'trashed'] as const;

export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export { RESEARCH_PHASES, type ResearchPhase } from '@/lib/common/research';

// ── Finding types (auto-generated from survey data) ─────────────────

/** Source of the auto-finding — which analysis produced it. */
export const FINDING_SOURCES = ['yes_no', 'rating', 'multiple_choice', 'completion_rate'] as const;
export type FindingSource = (typeof FINDING_SOURCES)[number];

/** An auto-generated finding derived from quantitative survey data. */
export interface Finding {
  source: FindingSource;
  questionText?: string;
  surveyTitle?: string;
  value: number;
  detail?: string;
}

// ── Row types (from DB) ─────────────────────────────────────────────

export type Project = Tables<'projects'>;
export type ProjectInsight = Tables<'project_insights'>;
