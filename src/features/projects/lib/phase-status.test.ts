/** Tests for phase status computation utility. */
import { describe, expect, it } from 'vitest';

import type { ProjectSurvey } from '@/features/projects/actions/get-project';
import { FINDING_THRESHOLDS } from '@/features/projects/config/signals';

import { computePhaseStatuses } from './phase-status';

// ── Helpers ────────────────────────────────────────────────────────

/** Create a minimal ProjectSurvey stub with the given overrides. */
function makeSurvey(overrides: Partial<ProjectSurvey> = {}): ProjectSurvey {
  return {
    id: crypto.randomUUID(),
    title: 'Test Survey',
    status: 'draft',
    researchPhase: null,
    responseCount: 0,
    completedCount: 0,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

const MIN = FINDING_THRESHOLDS.minResponses; // 5

// ── computePhaseStatuses ───────────────────────────────────────────

describe('computePhaseStatuses', () => {
  it('returns not_started for all phases when input is empty', () => {
    const result = computePhaseStatuses({});

    expect(result).toEqual({
      problem_discovery: 'not_started',
      solution_validation: 'not_started',
      market_validation: 'not_started',
      launch_readiness: 'not_started',
    });
  });

  it('returns not_started for phases with no surveys', () => {
    const result = computePhaseStatuses({
      problem_discovery: [makeSurvey({ status: 'completed', completedCount: MIN })],
    });

    expect(result.solution_validation).toBe('not_started');
    expect(result.market_validation).toBe('not_started');
    expect(result.launch_readiness).toBe('not_started');
  });

  // ── in_progress ──────────────────────────────────────────────────

  it('returns in_progress when phase has a draft survey', () => {
    const result = computePhaseStatuses({
      problem_discovery: [makeSurvey({ status: 'draft' })],
    });

    expect(result.problem_discovery).toBe('in_progress');
  });

  it('returns in_progress when phase has an active survey', () => {
    const result = computePhaseStatuses({
      solution_validation: [makeSurvey({ status: 'active', completedCount: 3 })],
    });

    expect(result.solution_validation).toBe('in_progress');
  });

  it('returns in_progress when completed survey has fewer than minResponses', () => {
    const result = computePhaseStatuses({
      market_validation: [makeSurvey({ status: 'completed', completedCount: MIN - 1 })],
    });

    expect(result.market_validation).toBe('in_progress');
  });

  it('returns in_progress when completed survey has zero responses', () => {
    const result = computePhaseStatuses({
      launch_readiness: [makeSurvey({ status: 'completed', completedCount: 0 })],
    });

    expect(result.launch_readiness).toBe('in_progress');
  });

  // ── validated ────────────────────────────────────────────────────

  it('returns validated when completed survey has exactly minResponses', () => {
    const result = computePhaseStatuses({
      problem_discovery: [makeSurvey({ status: 'completed', completedCount: MIN })],
    });

    expect(result.problem_discovery).toBe('validated');
  });

  it('returns validated when completed survey has more than minResponses', () => {
    const result = computePhaseStatuses({
      solution_validation: [makeSurvey({ status: 'completed', completedCount: MIN + 10 })],
    });

    expect(result.solution_validation).toBe('validated');
  });

  it('returns validated when at least one survey qualifies among multiple', () => {
    const result = computePhaseStatuses({
      market_validation: [
        makeSurvey({ status: 'draft', completedCount: 0 }),
        makeSurvey({ status: 'active', completedCount: 2 }),
        makeSurvey({ status: 'completed', completedCount: MIN }),
      ],
    });

    expect(result.market_validation).toBe('validated');
  });

  // ── mixed phases ─────────────────────────────────────────────────

  it('handles a mix of statuses across all phases', () => {
    const result = computePhaseStatuses({
      problem_discovery: [makeSurvey({ status: 'completed', completedCount: MIN })],
      solution_validation: [makeSurvey({ status: 'active', completedCount: 3 })],
      market_validation: [],
      // launch_readiness intentionally missing from input
    });

    expect(result).toEqual({
      problem_discovery: 'validated',
      solution_validation: 'in_progress',
      market_validation: 'not_started',
      launch_readiness: 'not_started',
    });
  });

  // ── edge cases ───────────────────────────────────────────────────

  it('ignores non-completed surveys even with many responses', () => {
    const result = computePhaseStatuses({
      problem_discovery: [makeSurvey({ status: 'active', completedCount: 100 })],
    });

    expect(result.problem_discovery).toBe('in_progress');
  });

  it('ignores unrelated keys in surveysByPhase', () => {
    const result = computePhaseStatuses({
      unassigned: [makeSurvey({ status: 'completed', completedCount: MIN })],
      some_random_key: [makeSurvey({ status: 'completed', completedCount: MIN })],
    });

    expect(result).toEqual({
      problem_discovery: 'not_started',
      solution_validation: 'not_started',
      market_validation: 'not_started',
      launch_readiness: 'not_started',
    });
  });

  it('handles multiple completed surveys — one below, one at threshold', () => {
    const result = computePhaseStatuses({
      launch_readiness: [
        makeSurvey({ status: 'completed', completedCount: MIN - 1 }),
        makeSurvey({ status: 'completed', completedCount: MIN }),
      ],
    });

    expect(result.launch_readiness).toBe('validated');
  });

  it('handles multiple completed surveys all below threshold', () => {
    const result = computePhaseStatuses({
      launch_readiness: [
        makeSurvey({ status: 'completed', completedCount: 1 }),
        makeSurvey({ status: 'completed', completedCount: MIN - 1 }),
      ],
    });

    expect(result.launch_readiness).toBe('in_progress');
  });
});
