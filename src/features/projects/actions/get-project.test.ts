// @vitest-environment node
/** Tests for fetching a single project with surveys via getProject. */
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

const PROJECT_ID = '00000000-0000-4000-8000-000000000001';
const USER = { id: 'user-123', email: 'test@example.com' };

const PROJECT_ROW = {
  id: PROJECT_ID,
  user_id: USER.id,
  name: 'Test Project',
  summary: null,
  description: null,
  image_url: null,
  status: 'active',
  archived_at: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

// ── Tests ────────────────────────────────────────────────────────────

describe('getProject', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: USER } });
  });

  it('should return null when user is not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const { getProject } = await import('./get-project');
    const result = await getProject(PROJECT_ID);

    expect(result).toBeNull();
  });

  it('should return null when project not found', async () => {
    mockFrom.mockReturnValue(chain({ data: null }));

    const { getProject } = await import('./get-project');
    const result = await getProject(PROJECT_ID);

    expect(result).toBeNull();
  });

  it('should return null on query error', async () => {
    mockFrom.mockReturnValue(chain({ error: { message: 'Query failed' } }));

    const { getProject } = await import('./get-project');
    const result = await getProject(PROJECT_ID);

    expect(result).toBeNull();
  });

  it('should return project detail with surveys', async () => {
    const projectChain = chain({ data: PROJECT_ROW });

    const surveysChain = chain({
      data: [
        {
          id: 's1',
          title: 'Survey A',
          status: 'active',
          created_at: '2026-01-01T00:00:00Z',
          survey_responses: [{ count: 5 }],
        },
        {
          id: 's2',
          title: 'Survey B',
          status: 'draft',
          created_at: '2026-01-02T00:00:00Z',
          survey_responses: [{ count: 0 }],
        },
        {
          id: 's3',
          title: 'Survey C',
          status: 'active',
          created_at: '2026-01-03T00:00:00Z',
          survey_responses: [{ count: 3 }],
        },
      ],
    });

    mockFrom.mockImplementation((table: string) => {
      if (table === 'surveys') {
        return surveysChain;
      }

      return projectChain;
    });

    const { getProject } = await import('./get-project');
    const result = await getProject(PROJECT_ID);

    expect(result).not.toBeNull();
    expect(result!.project.id).toBe(PROJECT_ID);
    expect(result!.surveys).toHaveLength(3);
  });

  it('should return project with empty surveys when none linked', async () => {
    const projectChain = chain({ data: PROJECT_ROW });
    const surveysChain = chain({ data: [] });

    mockFrom.mockImplementation((table: string) => {
      if (table === 'surveys') {
        return surveysChain;
      }

      return projectChain;
    });

    const { getProject } = await import('./get-project');
    const result = await getProject(PROJECT_ID);

    expect(result).not.toBeNull();
    expect(result!.surveys).toEqual([]);
  });
});
