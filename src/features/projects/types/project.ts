import type { Tables } from '@/lib/supabase/types';

// ── Enum tuples (source of truth, matching DB CHECK constraints) ────

/** All insight types as a const tuple (source of truth). */
export const INSIGHT_TYPES = ['strength', 'opportunity', 'threat', 'decision'] as const;

export type InsightType = (typeof INSIGHT_TYPES)[number];

/** All project lifecycle statuses as a const tuple (source of truth). */
export const PROJECT_STATUSES = ['active', 'completed', 'archived', 'trashed'] as const;

export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

/** All research phases as a const tuple (source of truth, matching DB CHECK constraints). */
export const RESEARCH_PHASES = ['idea', 'research', 'validation', 'decision'] as const;

export type ResearchPhase = (typeof RESEARCH_PHASES)[number];

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
