import type { Tables } from '@/lib/supabase/types';

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
