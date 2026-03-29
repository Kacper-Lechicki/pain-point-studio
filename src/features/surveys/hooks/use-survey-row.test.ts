// @vitest-environment jsdom
/** useSurveyRow: derives display state, labels, and actions for a single survey row. */
import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { UserSurvey } from '@/features/surveys/types';

import { useSurveyRow } from './use-survey-row';

// ── Mocks ────────────────────────────────────────────────────────────

const mocks = vi.hoisted(() => ({
  mockHandleActionClick: vi.fn(),
  mockConfirmDialogProps: { open: false },
  mockRelativeTime: vi.fn(() => '2 hours ago'),
}));

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useFormatter: () => ({ relativeTime: mocks.mockRelativeTime }),
}));

vi.mock('@/features/surveys/hooks/use-survey-action', () => ({
  useSurveyAction: () => ({
    handleActionClick: mocks.mockHandleActionClick,
    confirmDialogProps: mocks.mockConfirmDialogProps,
  }),
}));

vi.mock('@/features/surveys/hooks/use-survey-card-actions', () => ({
  useSurveyCardActions: (slug: string | null) => ({
    shareUrl: slug ? `https://example.com/en/r/${slug}` : null,
    shareDialogOpen: false,
    setShareDialogOpen: vi.fn(),
    handleShare: vi.fn(),
  }),
}));

vi.mock('@/features/surveys/components/dashboard/sparkline', () => ({
  getSparklineColor: () => 'hsl(var(--chart-2))',
}));

vi.mock('@/features/surveys/config', () => ({
  SURVEY_RETENTION_DAYS: 14,
}));

vi.mock('@/lib/common/calculations', () => ({
  daysUntilExpiry: () => 10,
}));

// ── Helpers ──────────────────────────────────────────────────────────

const NOW = new Date('2025-01-15T12:00:00Z');

function makeSurvey(overrides: Partial<UserSurvey> = {}): UserSurvey {
  return {
    id: 'survey-1',
    title: 'Test Survey',
    description: 'A test survey',
    status: 'active',
    slug: 'test-survey',
    viewCount: 100,
    responseCount: 50,
    completedCount: 40,
    questionCount: 5,
    recentActivity: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
    lastResponseAt: '2025-01-15T10:00:00Z',
    startsAt: null,
    endsAt: null,
    maxRespondents: null,
    completedAt: null,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-15T08:00:00Z',
    avgCompletionSeconds: 120,
    avgQuestionCompletion: 0.95,
    projectId: 'project-1',
    projectName: 'Test Project',
    researchPhase: null,
    deletedAt: null,
    preTrashStatus: null,
    ...overrides,
  };
}

// ── Tests ────────────────────────────────────────────────────────────

describe('useSurveyRow', () => {
  const onStatusChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should derive correct flags for an active survey', () => {
    const survey = makeSurvey({ status: 'active' });
    const { result } = renderHook(() => useSurveyRow(survey, NOW, onStatusChange));

    expect(result.current.isActive).toBe(true);
    expect(result.current.isDraft).toBe(false);
    expect(result.current.isCompleted).toBe(false);
  });

  it('should derive correct flags for a draft survey', () => {
    const survey = makeSurvey({ status: 'draft' });
    const { result } = renderHook(() => useSurveyRow(survey, NOW, onStatusChange));

    expect(result.current.isDraft).toBe(true);
    expect(result.current.isActive).toBe(false);
  });

  it('should compute hasShareableLink for active survey with slug', () => {
    const survey = makeSurvey({ status: 'active', slug: 'test' });
    const { result } = renderHook(() => useSurveyRow(survey, NOW, onStatusChange));

    expect(result.current.hasShareableLink).toBe(true);
  });

  it('should not have shareable link for draft survey', () => {
    const survey = makeSurvey({ status: 'draft', slug: 'test' });
    const { result } = renderHook(() => useSurveyRow(survey, NOW, onStatusChange));

    expect(result.current.hasShareableLink).toBe(false);
  });

  it('should not have shareable link when slug is null', () => {
    const survey = makeSurvey({ status: 'active', slug: null });
    const { result } = renderHook(() => useSurveyRow(survey, NOW, onStatusChange));

    expect(result.current.hasShareableLink).toBe(false);
  });

  it('should compute canExport for non-draft surveys', () => {
    const active = makeSurvey({ status: 'active' });
    const draft = makeSurvey({ status: 'draft' });

    const { result: activeResult } = renderHook(() => useSurveyRow(active, NOW, onStatusChange));
    const { result: draftResult } = renderHook(() => useSurveyRow(draft, NOW, onStatusChange));

    expect(activeResult.current.canExport).toBe(true);
    expect(draftResult.current.canExport).toBe(false);
  });

  it('should compute updatedAtLabel via formatter', () => {
    const survey = makeSurvey();
    const { result } = renderHook(() => useSurveyRow(survey, NOW, onStatusChange));

    expect(result.current.updatedAtLabel).toBe('2 hours ago');
    expect(mocks.mockRelativeTime).toHaveBeenCalled();
  });

  it('should compute lastResponseLabel when lastResponseAt is set', () => {
    const survey = makeSurvey({ lastResponseAt: '2025-01-15T10:00:00Z' });
    const { result } = renderHook(() => useSurveyRow(survey, NOW, onStatusChange));

    expect(result.current.lastResponseLabel).toBe('2 hours ago');
  });

  it('should return null lastResponseLabel when lastResponseAt is null', () => {
    const survey = makeSurvey({ lastResponseAt: null });
    const { result } = renderHook(() => useSurveyRow(survey, NOW, onStatusChange));

    expect(result.current.lastResponseLabel).toBeNull();
  });

  it('should compute linkExpiryDays for completed surveys', () => {
    const survey = makeSurvey({ status: 'completed', completedAt: '2025-01-10T00:00:00Z' });
    const { result } = renderHook(() => useSurveyRow(survey, NOW, onStatusChange));

    expect(result.current.linkExpiryDays).toBe(10);
  });

  it('should return null linkExpiryDays for active surveys', () => {
    const survey = makeSurvey({ status: 'active' });
    const { result } = renderHook(() => useSurveyRow(survey, NOW, onStatusChange));

    expect(result.current.linkExpiryDays).toBeNull();
  });

  it('should return available actions from survey status config', () => {
    const survey = makeSurvey({ status: 'active' });
    const { result } = renderHook(() => useSurveyRow(survey, NOW, onStatusChange));

    expect(result.current.availableActions).toEqual(expect.arrayContaining(['complete', 'trash']));
  });

  it('should expose shareUrl from useSurveyCardActions', () => {
    const survey = makeSurvey({ slug: 'my-slug' });
    const { result } = renderHook(() => useSurveyRow(survey, NOW, onStatusChange));

    expect(result.current.shareUrl).toBe('https://example.com/en/r/my-slug');
  });
});
