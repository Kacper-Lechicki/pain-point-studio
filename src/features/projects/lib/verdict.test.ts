/** Tests for the verdict computation heuristic. */
import { describe, expect, it } from 'vitest';

import type { Finding, ProjectInsight } from '@/features/projects/types';

import { type VerdictInput, computeVerdict } from './verdict';

// ── Helpers ────────────────────────────────────────────────────────────

function makeInput(overrides: Partial<VerdictInput> = {}): VerdictInput {
  return {
    totalResponses: 0,
    targetResponses: 30,
    insightCount: 0,
    findings: [],
    insights: [],
    ...overrides,
  };
}

function makeFinding(source: Finding['source'], value: number): Finding {
  return { source, value };
}

function makeInsight(type: ProjectInsight['type']): ProjectInsight {
  return {
    id: crypto.randomUUID(),
    project_id: crypto.randomUUID(),
    type,
    content: `Test ${type} insight`,
    phase: null,
    sort_order: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

// ── Tests ──────────────────────────────────────────────────────────────

describe('computeVerdict', () => {
  it('returns no-data when totalResponses is 0', () => {
    const result = computeVerdict(makeInput());

    expect(result.status).toBe('no-data');
    expect(result.confidence).toBe(0);
  });

  it('returns exploring when confidence < 0.3', () => {
    const result = computeVerdict(makeInput({ totalResponses: 5 }));

    expect(result.status).toBe('exploring');
    expect(result.confidence).toBeCloseTo(5 / 30);
  });

  it('returns exploring when confidence < 0.7 and few signals', () => {
    const result = computeVerdict(
      makeInput({
        totalResponses: 15,
        findings: [makeFinding('yes_no', 0.8)],
        insightCount: 1,
      })
    );

    expect(result.status).toBe('exploring');
    expect(result.confidence).toBe(0.5);
  });

  it('returns promising when enough positive signals', () => {
    const result = computeVerdict(
      makeInput({
        totalResponses: 20,
        findings: [makeFinding('yes_no', 0.8), makeFinding('rating', 4.5)],
        insightCount: 2,
        insights: [makeInsight('strength'), makeInsight('opportunity')],
      })
    );

    expect(result.status).toBe('promising');
    expect(result.confidence).toBeCloseTo(20 / 30);
  });

  it('returns needs-attention when threats exist', () => {
    const result = computeVerdict(
      makeInput({
        totalResponses: 20,
        findings: [makeFinding('yes_no', 0.8), makeFinding('rating', 4.2)],
        insightCount: 2,
        insights: [makeInsight('strength'), makeInsight('threat')],
      })
    );

    expect(result.status).toBe('needs-attention');
  });

  it('returns needs-attention when negative findings exist', () => {
    const result = computeVerdict(
      makeInput({
        totalResponses: 20,
        findings: [
          makeFinding('yes_no', 0.3), // negative: <= 0.4
          makeFinding('rating', 4.2),
          makeFinding('multiple_choice', 0.6),
        ],
        insightCount: 1,
        insights: [makeInsight('strength')],
      })
    );

    expect(result.status).toBe('needs-attention');
  });

  it('returns validated when high confidence, no threats, no negative findings', () => {
    const result = computeVerdict(
      makeInput({
        totalResponses: 28,
        findings: [makeFinding('yes_no', 0.85), makeFinding('rating', 4.5)],
        insightCount: 2,
        insights: [makeInsight('strength'), makeInsight('opportunity')],
      })
    );

    expect(result.status).toBe('validated');
    expect(result.confidence).toBeCloseTo(28 / 30);
  });

  it('returns invalidated when high confidence + many threats', () => {
    const result = computeVerdict(
      makeInput({
        totalResponses: 30,
        findings: [makeFinding('yes_no', 0.8)],
        insightCount: 3,
        insights: [makeInsight('threat'), makeInsight('threat'), makeInsight('strength')],
      })
    );

    expect(result.status).toBe('invalidated');
    expect(result.confidence).toBe(1);
  });

  it('returns invalidated when high confidence + many negative findings', () => {
    const result = computeVerdict(
      makeInput({
        totalResponses: 30,
        findings: [
          makeFinding('yes_no', 0.3),
          makeFinding('rating', 2.0),
          makeFinding('completion_rate', 0.4),
        ],
        insightCount: 1,
        insights: [makeInsight('strength')],
      })
    );

    expect(result.status).toBe('invalidated');
  });

  it('caps confidence at 1 when responses exceed target', () => {
    const result = computeVerdict(
      makeInput({
        totalResponses: 50,
        targetResponses: 30,
      })
    );

    expect(result.confidence).toBe(1);
  });

  it('handles targetResponses of 0 gracefully', () => {
    const result = computeVerdict(
      makeInput({
        totalResponses: 10,
        targetResponses: 0,
      })
    );

    expect(result.confidence).toBe(1);
    expect(result.status).toBe('exploring');
  });
});
