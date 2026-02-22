/** Tests for project sort helpers (default direction and comparator logic). */
import { describe, expect, it } from 'vitest';

import type { ProjectWithMetrics } from '@/features/projects/actions/get-projects';

import { getDefaultSortDir, getProjectComparator } from './sort-helpers';

function makeProject(overrides: Partial<ProjectWithMetrics> = {}): ProjectWithMetrics {
  return {
    id: '1',
    name: 'Test',
    description: null,
    context: 'idea_validation',
    status: 'active',
    user_id: 'user-1',
    archived_at: null,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-02T00:00:00Z',
    surveyCount: 0,
    responseCount: 0,
    validationProgress: null,
    ...overrides,
  };
}

// ── getDefaultSortDir ─────────────────────────────────────────────────

describe('getDefaultSortDir', () => {
  it('should return "asc" for name', () => {
    expect(getDefaultSortDir('name')).toBe('asc');
  });

  it('should return "asc" for status', () => {
    expect(getDefaultSortDir('status')).toBe('asc');
  });

  it('should return "asc" for context', () => {
    expect(getDefaultSortDir('context')).toBe('asc');
  });

  it('should return "desc" for updated', () => {
    expect(getDefaultSortDir('updated')).toBe('desc');
  });

  it('should return "desc" for created', () => {
    expect(getDefaultSortDir('created')).toBe('desc');
  });

  it('should return "desc" for surveys', () => {
    expect(getDefaultSortDir('surveys')).toBe('desc');
  });

  it('should return "desc" for responses', () => {
    expect(getDefaultSortDir('responses')).toBe('desc');
  });

  it('should return "desc" for unknown keys', () => {
    expect(getDefaultSortDir('anything')).toBe('desc');
  });
});

// ── getProjectComparator ──────────────────────────────────────────────

describe('getProjectComparator', () => {
  const a = makeProject({
    id: 'a',
    name: 'Alpha',
    status: 'active',
    context: 'custom',
    surveyCount: 3,
    responseCount: 10,
    validationProgress: 0.25,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-10T00:00:00Z',
  });

  const b = makeProject({
    id: 'b',
    name: 'Beta',
    status: 'archived',
    context: 'idea_validation',
    surveyCount: 5,
    responseCount: 20,
    validationProgress: 0.75,
    created_at: '2025-02-01T00:00:00Z',
    updated_at: '2025-02-10T00:00:00Z',
  });

  it('should sort by name ascending', () => {
    const cmp = getProjectComparator('name', 'asc');
    expect(cmp(a, b)).toBeLessThan(0);
  });

  it('should sort by name descending', () => {
    const cmp = getProjectComparator('name', 'desc');
    expect(cmp(a, b)).toBeGreaterThan(0);
  });

  it('should sort by status ascending with name tiebreaker', () => {
    const cmp = getProjectComparator('status', 'asc');
    expect(cmp(a, b)).toBeLessThan(0);
  });

  it('should sort by status descending', () => {
    const cmp = getProjectComparator('status', 'desc');
    expect(cmp(a, b)).toBeGreaterThan(0);
  });

  it('should use name as tiebreaker when statuses match', () => {
    const p1 = makeProject({ name: 'Zebra', status: 'active' });
    const p2 = makeProject({ name: 'Apple', status: 'active' });
    const cmp = getProjectComparator('status', 'asc');
    expect(cmp(p1, p2)).toBeGreaterThan(0);
  });

  it('should sort by context ascending', () => {
    const cmp = getProjectComparator('context', 'asc');
    expect(cmp(a, b)).toBeLessThan(0);
  });

  it('should sort by context descending', () => {
    const cmp = getProjectComparator('context', 'desc');
    expect(cmp(a, b)).toBeGreaterThan(0);
  });

  it('should use name as tiebreaker when contexts match', () => {
    const p1 = makeProject({ name: 'Zebra', context: 'custom' });
    const p2 = makeProject({ name: 'Apple', context: 'custom' });
    const cmp = getProjectComparator('context', 'asc');
    expect(cmp(p1, p2)).toBeGreaterThan(0);
  });

  it('should sort by surveys ascending', () => {
    const cmp = getProjectComparator('surveys', 'asc');
    expect(cmp(a, b)).toBeLessThan(0);
  });

  it('should sort by surveys descending', () => {
    const cmp = getProjectComparator('surveys', 'desc');
    expect(cmp(a, b)).toBeGreaterThan(0);
  });

  it('should use name as tiebreaker when survey counts match', () => {
    const p1 = makeProject({ name: 'Zebra', surveyCount: 3 });
    const p2 = makeProject({ name: 'Apple', surveyCount: 3 });
    const cmp = getProjectComparator('surveys', 'asc');
    expect(cmp(p1, p2)).toBeGreaterThan(0);
  });

  it('should sort by responses ascending', () => {
    const cmp = getProjectComparator('responses', 'asc');
    expect(cmp(a, b)).toBeLessThan(0);
  });

  it('should sort by responses descending', () => {
    const cmp = getProjectComparator('responses', 'desc');
    expect(cmp(a, b)).toBeGreaterThan(0);
  });

  it('should sort by progress ascending', () => {
    const cmp = getProjectComparator('progress', 'asc');
    expect(cmp(a, b)).toBeLessThan(0);
  });

  it('should sort by progress descending', () => {
    const cmp = getProjectComparator('progress', 'desc');
    expect(cmp(a, b)).toBeGreaterThan(0);
  });

  it('should treat null progress as -1 (sorted before 0)', () => {
    const pNull = makeProject({ name: 'NoProgress', validationProgress: null });
    const pZero = makeProject({ name: 'ZeroProgress', validationProgress: 0 });
    const cmp = getProjectComparator('progress', 'asc');
    expect(cmp(pNull, pZero)).toBeLessThan(0);
  });

  it('should use name as tiebreaker when progress matches', () => {
    const p1 = makeProject({ name: 'Zebra', validationProgress: 0.5 });
    const p2 = makeProject({ name: 'Apple', validationProgress: 0.5 });
    const cmp = getProjectComparator('progress', 'asc');
    expect(cmp(p1, p2)).toBeGreaterThan(0);
  });

  it('should sort by created ascending', () => {
    const cmp = getProjectComparator('created', 'asc');
    expect(cmp(a, b)).toBeLessThan(0);
  });

  it('should sort by created descending', () => {
    const cmp = getProjectComparator('created', 'desc');
    expect(cmp(a, b)).toBeGreaterThan(0);
  });

  it('should sort by updated ascending', () => {
    const cmp = getProjectComparator('updated', 'asc');
    expect(cmp(a, b)).toBeLessThan(0);
  });

  it('should sort by updated descending', () => {
    const cmp = getProjectComparator('updated', 'desc');
    expect(cmp(a, b)).toBeGreaterThan(0);
  });
});
