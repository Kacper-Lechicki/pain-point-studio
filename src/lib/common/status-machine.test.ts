import { describe, expect, it } from 'vitest';

import { KPI_COLOR_ALL, canTransition, getAvailableActions } from './status-machine';
import type { StatusTransitionMap } from './status-machine';

type TestStatus = 'draft' | 'active' | 'done';

const TEST_TRANSITIONS = {
  publish: { method: 'update', toStatus: 'active', fromStatuses: ['draft'] },
  finish: { method: 'update', toStatus: 'done', fromStatuses: ['active'] },
  reset: { method: 'update', toStatus: 'draft', fromStatuses: ['active', 'done'] },
  remove: { method: 'delete', fromStatuses: ['done'] },
} as const satisfies StatusTransitionMap<TestStatus>;

// ── canTransition ───────────────────────────────────────────────────

describe('canTransition', () => {
  it('returns true for a valid transition', () => {
    expect(canTransition('draft', 'publish', TEST_TRANSITIONS)).toBe(true);
  });

  it('returns false when the source status is not in fromStatuses', () => {
    expect(canTransition('done', 'publish', TEST_TRANSITIONS)).toBe(false);
  });

  it('returns false for an unknown action', () => {
    expect(canTransition('draft', 'nonexistent', TEST_TRANSITIONS)).toBe(false);
  });

  it('handles multiple valid source statuses', () => {
    expect(canTransition('active', 'reset', TEST_TRANSITIONS)).toBe(true);
    expect(canTransition('done', 'reset', TEST_TRANSITIONS)).toBe(true);
    expect(canTransition('draft', 'reset', TEST_TRANSITIONS)).toBe(false);
  });
});

// ── getAvailableActions ─────────────────────────────────────────────

describe('getAvailableActions', () => {
  it('returns all valid actions for a status', () => {
    expect(getAvailableActions('active', TEST_TRANSITIONS)).toEqual(['finish', 'reset']);
  });

  it('returns a single action when only one is valid', () => {
    expect(getAvailableActions('draft', TEST_TRANSITIONS)).toEqual(['publish']);
  });

  it('returns multiple actions including delete', () => {
    expect(getAvailableActions('done', TEST_TRANSITIONS)).toEqual(['reset', 'remove']);
  });
});

// ── KPI_COLOR_ALL ───────────────────────────────────────────────────

describe('KPI_COLOR_ALL', () => {
  it('is the expected Tailwind class', () => {
    expect(KPI_COLOR_ALL).toBe('text-foreground');
  });
});
