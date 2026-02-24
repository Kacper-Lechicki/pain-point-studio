import type { PhaseStatus } from '@/features/projects/lib/phase-status';
import type { ResearchPhase } from '@/features/projects/types';
import { RESEARCH_PHASES } from '@/features/projects/types';

// ── Types ────────────────────────────────────────────────────────────

export type VerdictStatus = 'not_started' | 'needs_data' | 'in_progress' | 'ready' | 'validated';

// ── Derivation helpers ───────────────────────────────────────────────

/**
 * Derive the "current phase" — the first phase that is not yet validated.
 * If all phases are validated, returns the last phase (launch_readiness).
 * Returns `null` for custom-context projects (no phase data).
 */
export function deriveCurrentPhase(
  phaseStatuses: Record<ResearchPhase, PhaseStatus> | null
): ResearchPhase | null {
  if (!phaseStatuses) {
    return null;
  }

  for (const phase of RESEARCH_PHASES) {
    if (phaseStatuses[phase] !== 'validated') {
      return phase;
    }
  }

  return RESEARCH_PHASES[RESEARCH_PHASES.length - 1] ?? null;
}

/**
 * Derive a high-level verdict from phase statuses.
 *
 * - `not_started`  — all phases are not_started
 * - `needs_data`   — at least one in_progress, none validated
 * - `in_progress`  — mix of validated and non-validated
 * - `ready`        — 3+ of 4 phases validated
 * - `validated`    — all 4 phases validated
 *
 * Returns `null` for custom-context projects (no phase data).
 */
export function deriveVerdictStatus(
  phaseStatuses: Record<ResearchPhase, PhaseStatus> | null
): VerdictStatus | null {
  if (!phaseStatuses) {
    return null;
  }

  const statuses = RESEARCH_PHASES.map((p) => phaseStatuses[p]);
  const validatedCount = statuses.filter((s) => s === 'validated').length;
  const notStartedCount = statuses.filter((s) => s === 'not_started').length;

  if (validatedCount === RESEARCH_PHASES.length) {
    return 'validated';
  }

  if (validatedCount >= 3) {
    return 'ready';
  }

  if (notStartedCount === RESEARCH_PHASES.length) {
    return 'not_started';
  }

  if (validatedCount === 0) {
    return 'needs_data';
  }

  return 'in_progress';
}
