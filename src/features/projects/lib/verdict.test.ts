/** Tests for the verdict computation heuristic. */
import { describe, expect, it } from 'vitest';

import type { Finding } from '@/features/projects/types';

import { type VerdictInput, computeVerdict } from './verdict';

// ── Helpers ────────────────────────────────────────────────────────────

function makeInput(overrides: Partial<VerdictInput> = {}): VerdictInput {
  return {
    totalResponses: 0,
    responseLimit: 50,
    findings: [],
    ...overrides,
  };
}

function makeFinding(source: Finding['source'], value: number): Finding {
  return { source, value };
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
    expect(result.confidence).toBeCloseTo(5 / 50);
  });

  it('returns exploring when confidence < 0.7 and few signals', () => {
    const result = computeVerdict(
      makeInput({
        totalResponses: 20,
        responseLimit: 50,
        findings: [makeFinding('yes_no', 0.8)],
      })
    );

    expect(result.status).toBe('exploring');
    expect(result.confidence).toBe(0.4);
  });

  it('returns promising when enough positive signals', () => {
    const result = computeVerdict(
      makeInput({
        totalResponses: 35,
        responseLimit: 50,
        findings: [
          makeFinding('yes_no', 0.8),
          makeFinding('rating', 4.5),
          makeFinding('completion_rate', 0.9),
        ],
      })
    );

    expect(result.status).toBe('promising');
    expect(result.confidence).toBeCloseTo(35 / 50);
  });

  it('returns needs-attention when negative findings exist', () => {
    const result = computeVerdict(
      makeInput({
        totalResponses: 35,
        responseLimit: 50,
        findings: [
          makeFinding('yes_no', 0.3), // negative: <= 0.4
          makeFinding('rating', 4.2),
          makeFinding('completion_rate', 0.9),
        ],
      })
    );

    expect(result.status).toBe('needs-attention');
  });

  it('returns needs-attention when low rating finding exists', () => {
    const result = computeVerdict(
      makeInput({
        totalResponses: 35,
        responseLimit: 50,
        findings: [
          makeFinding('yes_no', 0.8),
          makeFinding('rating', 2.0), // negative: <= low threshold
          makeFinding('completion_rate', 0.9),
        ],
      })
    );

    expect(result.status).toBe('needs-attention');
  });

  it('returns validated when high confidence, no negative findings', () => {
    const result = computeVerdict(
      makeInput({
        totalResponses: 46,
        responseLimit: 50,
        findings: [
          makeFinding('yes_no', 0.85),
          makeFinding('rating', 4.5),
          makeFinding('completion_rate', 0.9),
        ],
      })
    );

    expect(result.status).toBe('validated');
    expect(result.confidence).toBeCloseTo(46 / 50);
  });

  it('returns invalidated when high confidence + many negative findings', () => {
    const result = computeVerdict(
      makeInput({
        totalResponses: 50,
        responseLimit: 50,
        findings: [
          makeFinding('yes_no', 0.3),
          makeFinding('rating', 2.0),
          makeFinding('completion_rate', 0.4),
        ],
      })
    );

    expect(result.status).toBe('invalidated');
    expect(result.confidence).toBe(1);
  });

  it('caps confidence at 1 when responses exceed target', () => {
    const result = computeVerdict(
      makeInput({
        totalResponses: 60,
        responseLimit: 50,
      })
    );

    expect(result.confidence).toBe(1);
  });

  it('handles responseLimit of 0 gracefully', () => {
    const result = computeVerdict(
      makeInput({
        totalResponses: 10,
        responseLimit: 0,
      })
    );

    expect(result.confidence).toBe(1);
    expect(result.status).toBe('exploring');
  });
});
