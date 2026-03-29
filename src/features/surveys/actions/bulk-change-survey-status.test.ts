// @vitest-environment node
/** Tests for bulkChangeSurveyStatus — validates transitions, checks active projects, updates/deletes. */
import { beforeEach, describe, expect, it, vi } from 'vitest';

// ── Helpers ──────────────────────────────────────────────────────────

import { TEST_USER as USER, chain } from '@/test-utils/action-helpers';

// ── Mocks ────────────────────────────────────────────────────────────

vi.mock('@/lib/common/env', () => ({
  env: {
    NODE_ENV: 'production',
    NEXT_PUBLIC_APP_URL: 'https://example.com',
    NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:54321',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
    SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
  },
}));

vi.mock('@/lib/common/rate-limit', () => ({
  rateLimit: vi.fn().mockResolvedValue({ limited: false }),
}));

const mockGetUser = vi.fn();
const mockFrom = vi.fn();
const mockRpc = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: mockGetUser },
    from: mockFrom,
    rpc: mockRpc,
  }),
}));

vi.mock('@/features/surveys/config/survey-status', () => ({
  canTransition: vi.fn().mockReturnValue(true),
}));

const ID1 = '00000000-0000-4000-8000-000000000001';
const ID2 = '00000000-0000-4000-8000-000000000002';
const PROJECT_A = '00000000-0000-4000-8000-000000000010';

// ── Tests ────────────────────────────────────────────────────────────

describe('Survey Actions – Bulk Change Survey Status', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: USER } });
  });

  it('should succeed for all surveys when completing active surveys', async () => {
    // Call 1: fetch surveys
    mockFrom.mockReturnValueOnce(
      chain({
        data: [
          {
            id: ID1,
            status: 'active',
            pre_trash_status: null,
            project_id: PROJECT_A,
          },
          {
            id: ID2,
            status: 'active',
            pre_trash_status: null,
            project_id: PROJECT_A,
          },
        ],
      })
    );

    // Calls 2-3: per-survey updates
    mockFrom
      .mockReturnValueOnce(chain({ data: { id: ID1 }, error: null }))
      .mockReturnValueOnce(chain({ data: { id: ID2 }, error: null }));

    const { bulkChangeSurveyStatus } = await import('./bulk-change-survey-status');
    const result = await bulkChangeSurveyStatus({ surveyIds: [ID1, ID2], action: 'complete' });

    expect(result).toEqual({
      success: true,
      data: { total: 2, failed: 0, failedIds: [] },
    });

    expect(mockFrom).toHaveBeenCalledWith('surveys');
  });

  it('should return unexpected error when no surveys are found', async () => {
    mockFrom.mockReturnValueOnce(chain({ data: [] }));

    const { bulkChangeSurveyStatus } = await import('./bulk-change-survey-status');
    const result = await bulkChangeSurveyStatus({ surveyIds: [ID1, ID2], action: 'complete' });

    expect(result).toEqual({ error: 'surveys.errors.unexpected' });
  });

  it('should partially succeed when one transition is invalid', async () => {
    const { canTransition } = await import('@/features/surveys/config/survey-status');

    (canTransition as ReturnType<typeof vi.fn>)
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(true);

    // Call 1: fetch surveys
    mockFrom.mockReturnValueOnce(
      chain({
        data: [
          {
            id: ID1,
            status: 'completed',
            pre_trash_status: null,
            project_id: PROJECT_A,
          },
          {
            id: ID2,
            status: 'active',
            pre_trash_status: null,
            project_id: PROJECT_A,
          },
        ],
      })
    );

    // Call 2: update for ID2 (ID1 skipped due to invalid transition)
    mockFrom.mockReturnValueOnce(chain({ data: { id: ID2 }, error: null }));

    const { bulkChangeSurveyStatus } = await import('./bulk-change-survey-status');
    const result = await bulkChangeSurveyStatus({ surveyIds: [ID1, ID2], action: 'complete' });

    expect(result).toEqual({
      success: true,
      data: { total: 2, failed: 1, failedIds: [ID1] },
    });
  });

  it('should use delete for permanentDelete action on trashed surveys', async () => {
    // Call 1: fetch surveys
    mockFrom.mockReturnValueOnce(
      chain({
        data: [
          {
            id: ID1,
            status: 'trashed',
            pre_trash_status: 'draft',
            project_id: PROJECT_A,
          },
          {
            id: ID2,
            status: 'trashed',
            pre_trash_status: 'active',
            project_id: PROJECT_A,
          },
        ],
      })
    );

    // Calls 2-3: per-survey deletes
    mockFrom
      .mockReturnValueOnce(chain({ data: { id: ID1 }, error: null }))
      .mockReturnValueOnce(chain({ data: { id: ID2 }, error: null }));

    const { bulkChangeSurveyStatus } = await import('./bulk-change-survey-status');
    const result = await bulkChangeSurveyStatus({
      surveyIds: [ID1, ID2],
      action: 'permanentDelete',
    });

    expect(result).toEqual({
      success: true,
      data: { total: 2, failed: 0, failedIds: [] },
    });
  });

  it('should return bulkAllFailed when all transitions are invalid', async () => {
    const { canTransition } = await import('@/features/surveys/config/survey-status');

    (canTransition as ReturnType<typeof vi.fn>)
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(false);

    // Call 1: fetch surveys
    mockFrom.mockReturnValueOnce(
      chain({
        data: [
          {
            id: ID1,
            status: 'trashed',
            pre_trash_status: null,
            project_id: PROJECT_A,
          },
          {
            id: ID2,
            status: 'trashed',
            pre_trash_status: null,
            project_id: PROJECT_A,
          },
        ],
      })
    );

    const { bulkChangeSurveyStatus } = await import('./bulk-change-survey-status');
    const result = await bulkChangeSurveyStatus({ surveyIds: [ID1, ID2], action: 'complete' });

    expect(result).toEqual({
      error: 'surveys.errors.bulkAllFailed',
      data: { total: 2, failed: 2, failedIds: [ID1, ID2] },
    });
  });

  it('should return validation error for empty surveyIds array', async () => {
    const { bulkChangeSurveyStatus } = await import('./bulk-change-survey-status');
    const result = await bulkChangeSurveyStatus({ surveyIds: [], action: 'complete' });

    expect(result.error).toBeDefined();
    expect(mockFrom).not.toHaveBeenCalled();
  });
});
