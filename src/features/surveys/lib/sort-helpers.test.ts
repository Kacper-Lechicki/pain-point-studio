/** Tests for survey sort helpers (default direction and comparator logic). */
import { describe, expect, it } from 'vitest';

import type { UserSurvey } from '@/features/surveys/actions/get-user-surveys';

import { getDefaultSortDir, getSurveyComparator } from './sort-helpers';

function makeSurvey(overrides: Partial<UserSurvey> = {}): UserSurvey {
  return {
    id: '1',
    title: 'Test',
    description: '',
    category: '',
    status: 'draft',
    slug: null,
    responseCount: 0,
    completedCount: 0,
    questionCount: 0,
    recentActivity: [],
    lastResponseAt: null,
    startsAt: null,
    endsAt: null,
    maxRespondents: null,
    archivedAt: null,
    cancelledAt: null,
    completedAt: null,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z',
    avgCompletionSeconds: null,
    avgQuestionCompletion: null,
    ...overrides,
  };
}

// ── getDefaultSortDir ─────────────────────────────────────────────────

describe('getDefaultSortDir', () => {
  it('should return "asc" for title', () => {
    expect(getDefaultSortDir('title')).toBe('asc');
  });

  it('should return "asc" for status', () => {
    expect(getDefaultSortDir('status')).toBe('asc');
  });

  it('should return "desc" for updated', () => {
    expect(getDefaultSortDir('updated')).toBe('desc');
  });

  it('should return "desc" for created', () => {
    expect(getDefaultSortDir('created')).toBe('desc');
  });

  it('should return "desc" for unknown keys', () => {
    expect(getDefaultSortDir('anything')).toBe('desc');
  });
});

// ── getSurveyComparator ───────────────────────────────────────────────

describe('getSurveyComparator', () => {
  const a = makeSurvey({
    id: 'a',
    title: 'Alpha',
    status: 'active',
    questionCount: 3,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-10T00:00:00Z',
  });

  const b = makeSurvey({
    id: 'b',
    title: 'Beta',
    status: 'draft',
    questionCount: 5,
    createdAt: '2024-02-01T00:00:00Z',
    updatedAt: '2024-02-10T00:00:00Z',
  });

  it('should sort by updated ascending', () => {
    const cmp = getSurveyComparator('updated', 'asc')!;
    expect(cmp(a, b)).toBeLessThan(0);
  });

  it('should sort by updated descending', () => {
    const cmp = getSurveyComparator('updated', 'desc')!;
    expect(cmp(a, b)).toBeGreaterThan(0);
  });

  it('should sort by created ascending', () => {
    const cmp = getSurveyComparator('created', 'asc')!;
    expect(cmp(a, b)).toBeLessThan(0);
  });

  it('should sort by created descending', () => {
    const cmp = getSurveyComparator('created', 'desc')!;
    expect(cmp(a, b)).toBeGreaterThan(0);
  });

  it('should sort by title ascending', () => {
    const cmp = getSurveyComparator('title', 'asc')!;
    expect(cmp(a, b)).toBeLessThan(0);
  });

  it('should sort by title descending', () => {
    const cmp = getSurveyComparator('title', 'desc')!;
    expect(cmp(a, b)).toBeGreaterThan(0);
  });

  it('should sort by status ascending with title tiebreaker', () => {
    const cmp = getSurveyComparator('status', 'asc')!;
    expect(cmp(a, b)).toBeLessThan(0);
  });

  it('should sort by status descending', () => {
    const cmp = getSurveyComparator('status', 'desc')!;
    expect(cmp(a, b)).toBeGreaterThan(0);
  });

  it('should use title as tiebreaker when statuses match', () => {
    const s1 = makeSurvey({ title: 'Zebra', status: 'draft' });
    const s2 = makeSurvey({ title: 'Apple', status: 'draft' });
    const cmp = getSurveyComparator('status', 'asc')!;
    expect(cmp(s1, s2)).toBeGreaterThan(0);
  });

  it('should sort by questions ascending', () => {
    const cmp = getSurveyComparator('questions', 'asc')!;
    expect(cmp(a, b)).toBeLessThan(0);
  });

  it('should sort by questions descending', () => {
    const cmp = getSurveyComparator('questions', 'desc')!;
    expect(cmp(a, b)).toBeGreaterThan(0);
  });

  it('should use updatedAt as tiebreaker when question counts match', () => {
    const s1 = makeSurvey({ questionCount: 3, updatedAt: '2024-03-01T00:00:00Z' });
    const s2 = makeSurvey({ questionCount: 3, updatedAt: '2024-01-01T00:00:00Z' });
    const cmp = getSurveyComparator('questions', 'asc')!;
    expect(cmp(s1, s2)).toBeLessThan(0);
  });

  it('should return undefined for unknown key', () => {
    expect(getSurveyComparator('unknown', 'asc')).toBeUndefined();
  });
});
