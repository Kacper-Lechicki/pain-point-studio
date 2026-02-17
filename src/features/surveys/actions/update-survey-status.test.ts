// @vitest-environment node
/** Tests for survey lifecycle status transitions (complete, cancel, archive, restore, delete). */
import { beforeEach, describe, expect, it, vi } from 'vitest';

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

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  }),
}));

// ── Helpers ──────────────────────────────────────────────────────────

function chain(result: { data?: unknown; error?: unknown } = {}) {
  const obj: { data: unknown; error: unknown; [k: string]: unknown } = {
    data: result.data ?? null,
    error: result.error ?? null,
  };

  return new Proxy(obj, {
    get(target, prop: string | symbol) {
      if (prop === 'then' || prop === 'catch' || prop === 'finally') {
        return Promise.resolve(target)[prop as 'then'].bind(Promise.resolve(target));
      }

      if (typeof prop !== 'string') {
        return undefined;
      }

      if (prop in target) {
        return target[prop];
      }

      target[prop] = vi.fn().mockReturnValue(new Proxy(target, this as ProxyHandler<object>));

      return target[prop];
    },
  });
}

const SURVEY_ID = '00000000-0000-4000-8000-000000000001';
const USER = { id: 'user-123', email: 'test@example.com' };

// ── Tests ────────────────────────────────────────────────────────────

describe('Survey status actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: USER } });
  });

  describe('completeSurvey', () => {
    it('should return success when update returns a row', async () => {
      const updateChain = chain({ data: { id: SURVEY_ID } });
      mockFrom.mockReturnValue(updateChain);

      const { completeSurvey } = await import('./update-survey-status');
      const result = await completeSurvey({ surveyId: SURVEY_ID });

      expect(result).toEqual({ success: true });
      expect(mockFrom).toHaveBeenCalledWith('surveys');
    });

    it('should return error when update returns no row', async () => {
      mockFrom.mockReturnValue(chain({ data: null, error: null }));

      const { completeSurvey } = await import('./update-survey-status');
      const result = await completeSurvey({ surveyId: SURVEY_ID });

      expect(result).toHaveProperty('error', 'surveys.errors.unexpected');
    });
  });

  describe('cancelSurvey', () => {
    it('should return success when update returns a row', async () => {
      mockFrom.mockReturnValue(chain({ data: { id: SURVEY_ID } }));

      const { cancelSurvey } = await import('./update-survey-status');
      const result = await cancelSurvey({ surveyId: SURVEY_ID });

      expect(result).toEqual({ success: true });
    });
  });

  describe('archiveSurvey', () => {
    it('should return success when select and update succeed', async () => {
      const selectChain = chain({ data: { status: 'draft' } });
      const updateChain = chain({ data: { id: SURVEY_ID } });
      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount++;

        return callCount === 1 ? selectChain : updateChain;
      });

      const { archiveSurvey } = await import('./update-survey-status');
      const result = await archiveSurvey({ surveyId: SURVEY_ID });

      expect(result).toEqual({ success: true });
    });
  });

  describe('restoreSurvey', () => {
    it('should return success when update and delete succeed', async () => {
      const updateChain = chain({ data: { id: SURVEY_ID } });
      const deleteChain = chain({ data: null, error: null });
      mockFrom.mockImplementation((table: string) => {
        if (table === 'survey_responses') {
          return deleteChain;
        }

        return updateChain;
      });

      const { restoreSurvey } = await import('./update-survey-status');
      const result = await restoreSurvey({ surveyId: SURVEY_ID });

      expect(result).toEqual({ success: true });
    });
  });

  describe('deleteSurveyDraft', () => {
    it('should return success when delete returns a row', async () => {
      mockFrom.mockReturnValue(chain({ data: { id: SURVEY_ID } }));

      const { deleteSurveyDraft } = await import('./update-survey-status');
      const result = await deleteSurveyDraft({ surveyId: SURVEY_ID });

      expect(result).toEqual({ success: true });
    });

    it('should return error when delete returns no row', async () => {
      mockFrom.mockReturnValue(chain({ data: null }));

      const { deleteSurveyDraft } = await import('./update-survey-status');
      const result = await deleteSurveyDraft({ surveyId: SURVEY_ID });

      expect(result).toHaveProperty('error', 'surveys.errors.unexpected');
    });
  });

  it('should return validation error for invalid surveyId', async () => {
    const { completeSurvey } = await import('./update-survey-status');
    const result = await completeSurvey({ surveyId: '' } as { surveyId: string });

    expect(result).toHaveProperty('error');
    expect(mockFrom).not.toHaveBeenCalled();
  });
});
