// @vitest-environment node
/** Tests for assigning/unassigning surveys to projects via the assignSurveyToProject action. */
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
  const obj: { data: unknown; error: unknown; [key: string]: unknown } = {
    data: result.data ?? null,
    error: result.error ?? null,
  };

  return new Proxy(obj, {
    get(target, prop) {
      if (prop === 'then' || prop === 'catch' || prop === 'finally') {
        return Promise.resolve(target)[prop as 'then'].bind(Promise.resolve(target));
      }

      const key = typeof prop === 'string' ? prop : undefined;

      if (key !== undefined && key in target) {
        return target[key];
      }

      if (key !== undefined) {
        target[key] = vi.fn().mockReturnValue(new Proxy(target, this));

        return target[key];
      }

      return undefined;
    },
  });
}

const USER = { id: 'user-123', email: 'test@example.com' };
const SURVEY_ID = '00000000-0000-4000-8000-000000000001';
const PROJECT_ID = '00000000-0000-4000-8000-000000000002';

// ── Tests ────────────────────────────────────────────────────────────

describe('Survey Actions – Assign Survey to Project', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: USER } });
  });

  it('should assign survey to project', async () => {
    const projectChain = chain({ data: { id: PROJECT_ID } });
    const updateChain = chain({ data: { id: SURVEY_ID } });

    mockFrom.mockReturnValueOnce(projectChain).mockReturnValueOnce(updateChain);

    const { assignSurveyToProject } = await import('./assign-survey-to-project');

    const result = await assignSurveyToProject({
      surveyId: SURVEY_ID,
      projectId: PROJECT_ID,
    });

    expect(result).toEqual({ success: true });
    expect(mockFrom).toHaveBeenCalledWith('projects');
    expect(mockFrom).toHaveBeenCalledWith('surveys');

    expect(updateChain.update).toHaveBeenCalledWith(
      expect.objectContaining({
        project_id: PROJECT_ID,
      })
    );
  });

  it('should return error when project is not found or not owned by user', async () => {
    const projectChain = chain({ data: null });

    mockFrom.mockReturnValueOnce(projectChain);

    const { assignSurveyToProject } = await import('./assign-survey-to-project');

    const result = await assignSurveyToProject({
      surveyId: SURVEY_ID,
      projectId: PROJECT_ID,
    });

    expect(result).toHaveProperty('error', 'surveys.errors.unexpected');
    expect(result).not.toHaveProperty('success');
    expect(mockFrom).toHaveBeenCalledTimes(1);
    expect(mockFrom).toHaveBeenCalledWith('projects');
  });

  it('should return error when survey update fails with error', async () => {
    const projectChain = chain({ data: { id: PROJECT_ID } });
    const updateChain = chain({ data: null, error: { message: 'Update failed' } });

    mockFrom.mockReturnValueOnce(projectChain).mockReturnValueOnce(updateChain);

    const { assignSurveyToProject } = await import('./assign-survey-to-project');

    const result = await assignSurveyToProject({
      surveyId: SURVEY_ID,
      projectId: PROJECT_ID,
    });

    expect(result).toHaveProperty('error', 'surveys.errors.unexpected');
    expect(result).not.toHaveProperty('success');
  });

  it('should return error when survey update returns null row', async () => {
    const projectChain = chain({ data: { id: PROJECT_ID } });
    const updateChain = chain({ data: null, error: null });

    mockFrom.mockReturnValueOnce(projectChain).mockReturnValueOnce(updateChain);

    const { assignSurveyToProject } = await import('./assign-survey-to-project');

    const result = await assignSurveyToProject({
      surveyId: SURVEY_ID,
      projectId: PROJECT_ID,
    });

    expect(result).toHaveProperty('error', 'surveys.errors.unexpected');
    expect(result).not.toHaveProperty('success');
  });

  it('should return validation error for invalid input', async () => {
    const { assignSurveyToProject } = await import('./assign-survey-to-project');

    const result = await assignSurveyToProject({
      surveyId: 'not-a-uuid',
      projectId: null,
    } as unknown as Parameters<typeof assignSurveyToProject>[0]);

    expect(result.error).toBeDefined();
    expect(mockFrom).not.toHaveBeenCalled();
  });
});
