/** Tests for computeHint contextual survey hints across all statuses. */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { UserSurvey } from '@/features/surveys/actions/get-user-surveys';

import { computeHint } from './survey-hints';

const t = vi.fn((key: string, params?: Record<string, unknown>) =>
  JSON.stringify({ key, ...params })
);

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

// ── computeHint ───────────────────────────────────────────────────────

describe('computeHint', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-06-01T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return info hint for draft with 0 questions', () => {
    const hint = computeHint(makeSurvey({ status: 'draft', questionCount: 0 }), t as never);

    expect(hint!.severity).toBe('info');
    expect(JSON.parse(hint!.text).key).toBe('surveys.dashboard.hints.noQuestions');
  });

  it('should return success hint for draft with questions', () => {
    const hint = computeHint(makeSurvey({ status: 'draft', questionCount: 5 }), t as never);

    expect(hint!.severity).toBe('success');
    expect(JSON.parse(hint!.text).key).toBe('surveys.dashboard.hints.readyToPublish');
    expect(JSON.parse(hint!.text).count).toBe(5);
  });

  it('should return warning when respondent limit is reached', () => {
    const hint = computeHint(
      makeSurvey({ status: 'active', maxRespondents: 10, responseCount: 10 }),
      t as never
    );

    expect(hint!.severity).toBe('warning');
    expect(JSON.parse(hint!.text).key).toBe('surveys.dashboard.hints.limitReached');
  });

  it('should return warning when nearing respondent limit', () => {
    const hint = computeHint(
      makeSurvey({ status: 'active', maxRespondents: 10, responseCount: 8 }),
      t as never
    );

    expect(hint!.severity).toBe('warning');
    expect(JSON.parse(hint!.text).key).toBe('surveys.dashboard.hints.nearingLimit');
  });

  it('should return warning when survey has expired', () => {
    const hint = computeHint(
      makeSurvey({ status: 'active', endsAt: '2025-05-30T00:00:00Z' }),
      t as never
    );

    expect(hint!.severity).toBe('warning');
    expect(JSON.parse(hint!.text).key).toBe('surveys.dashboard.hints.expired');
  });

  it('should return warning when survey is ending soon', () => {
    const hint = computeHint(
      makeSurvey({ status: 'active', endsAt: '2025-06-03T00:00:00Z' }),
      t as never
    );

    expect(hint!.severity).toBe('warning');
    expect(JSON.parse(hint!.text).key).toBe('surveys.dashboard.hints.endingSoon');
  });

  it('should return info when active with 0 responses', () => {
    const hint = computeHint(makeSurvey({ status: 'active', responseCount: 0 }), t as never);

    expect(hint!.severity).toBe('info');
    expect(JSON.parse(hint!.text).key).toBe('surveys.dashboard.hints.noResponsesYet');
  });

  it('should return null for active survey with responses but no limit or end date', () => {
    const hint = computeHint(makeSurvey({ status: 'active', responseCount: 5 }), t as never);

    expect(hint).toBeNull();
  });

  it('should return info with submission rate for completed with responses', () => {
    const hint = computeHint(
      makeSurvey({ status: 'completed', responseCount: 10, completedCount: 7 }),
      t as never
    );

    expect(hint!.severity).toBe('info');
    expect(JSON.parse(hint!.text).key).toBe('surveys.dashboard.hints.submissionRate');
    expect(JSON.parse(hint!.text).rate).toBe(70);
  });

  it('should return info for completed with 0 responses', () => {
    const hint = computeHint(makeSurvey({ status: 'completed', responseCount: 0 }), t as never);

    expect(hint!.severity).toBe('info');
    expect(JSON.parse(hint!.text).key).toBe('surveys.dashboard.hints.noResponsesCollected');
  });

  it('should return warning for cancelled survey', () => {
    const hint = computeHint(makeSurvey({ status: 'cancelled' }), t as never);

    expect(hint!.severity).toBe('warning');
    expect(JSON.parse(hint!.text).key).toBe('surveys.dashboard.hints.withdrawn');
  });

  it('should return null for archived survey', () => {
    const hint = computeHint(makeSurvey({ status: 'archived' }), t as never);
    expect(hint).toBeNull();
  });
});
