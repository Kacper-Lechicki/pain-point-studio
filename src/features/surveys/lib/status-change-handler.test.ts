/** Tests for applyOptimisticStatusChange survey list updates and deselection logic. */
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { UserSurvey } from '@/features/surveys/actions/get-user-surveys';

import { applyOptimisticStatusChange } from './status-change-handler';

function makeSurvey(overrides: Partial<UserSurvey> = {}): UserSurvey {
  return {
    id: '1',
    title: 'Test',
    description: '',
    status: 'draft',
    slug: null,
    viewCount: 0,
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
    projectId: 'project-1',
    projectName: 'Test Project',
    researchPhase: null,
    deletedAt: null,
    preTrashStatus: null,
    previousStatus: null,
    ...overrides,
  };
}

describe('applyOptimisticStatusChange', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-06-01T12:00:00Z'));
  });

  it('should remove survey from list on delete action', () => {
    const surveys = [makeSurvey({ id: 'a' }), makeSurvey({ id: 'b' })];

    const result = applyOptimisticStatusChange(surveys, 'a', 'delete');

    expect(result.updatedSurveys).toHaveLength(1);
    expect(result.updatedSurveys[0]?.id).toBe('b');
  });

  it('should return shouldDeselect true on delete', () => {
    const result = applyOptimisticStatusChange([makeSurvey()], '1', 'delete');
    expect(result.shouldDeselect).toBe(true);
  });

  it('should update status to "completed" on complete action', () => {
    const surveys = [makeSurvey({ id: 'a', status: 'active' })];

    const result = applyOptimisticStatusChange(surveys, 'a', 'complete');

    expect(result.updatedSurveys[0]?.status).toBe('completed');
  });

  it('should update status to "cancelled" on cancel action', () => {
    const surveys = [makeSurvey({ id: 'a', status: 'active' })];

    const result = applyOptimisticStatusChange(surveys, 'a', 'cancel');

    expect(result.updatedSurveys[0]?.status).toBe('cancelled');
  });

  it('should update status to "archived" on archive action', () => {
    const surveys = [makeSurvey({ id: 'a', status: 'completed' })];

    const result = applyOptimisticStatusChange(surveys, 'a', 'archive');

    expect(result.updatedSurveys[0]?.status).toBe('archived');
  });

  it('should update status to "draft" on restore action', () => {
    const surveys = [makeSurvey({ id: 'a', status: 'archived' })];

    const result = applyOptimisticStatusChange(surveys, 'a', 'restore');

    expect(result.updatedSurveys[0]?.status).toBe('draft');
  });

  it('should update updatedAt timestamp', () => {
    const surveys = [makeSurvey({ id: 'a', status: 'active' })];

    const result = applyOptimisticStatusChange(surveys, 'a', 'complete');

    expect(result.updatedSurveys[0]?.updatedAt).toBe('2025-06-01T12:00:00.000Z');
  });

  it('should not modify non-target surveys', () => {
    const surveys = [
      makeSurvey({ id: 'a', status: 'active' }),
      makeSurvey({ id: 'b', status: 'draft', title: 'Other' }),
    ];

    const result = applyOptimisticStatusChange(surveys, 'a', 'complete');

    expect(result.updatedSurveys[1]).toEqual(surveys[1]);
  });

  it('should return shouldDeselect false when target status is not in deselectOnStatuses', () => {
    const surveys = [makeSurvey({ id: 'a', status: 'active' })];

    const result = applyOptimisticStatusChange(surveys, 'a', 'complete', ['archived']);

    expect(result.shouldDeselect).toBe(false);
  });

  it('should return shouldDeselect true when target status is in deselectOnStatuses', () => {
    const surveys = [makeSurvey({ id: 'a', status: 'completed' })];

    const result = applyOptimisticStatusChange(surveys, 'a', 'archive', ['archived']);

    expect(result.shouldDeselect).toBe(true);
  });

  vi.useRealTimers();
});
