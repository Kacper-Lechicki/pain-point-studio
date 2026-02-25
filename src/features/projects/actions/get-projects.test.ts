// @vitest-environment node
/** Tests for listing the authenticated user's projects via getProjects. */
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

const USER = { id: 'user-123', email: 'test@example.com' };

function makeProject(overrides: Record<string, unknown> = {}) {
  return {
    id: crypto.randomUUID(),
    user_id: USER.id,
    name: 'Test Project',
    description: null,
    status: 'active',
    archived_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

// ── Tests ────────────────────────────────────────────────────────────

describe('getProjects', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: USER } });
  });

  it('should return null when user is not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const { getProjects } = await import('./get-projects');
    const result = await getProjects();

    expect(result).toBeNull();
  });

  it('should return null when projects query errors', async () => {
    mockFrom.mockReturnValue(chain({ error: { message: 'Query failed' } }));

    const { getProjects } = await import('./get-projects');
    const result = await getProjects();

    expect(result).toBeNull();
  });

  it('should return empty array when no projects exist', async () => {
    mockFrom.mockReturnValue(chain({ data: [] }));

    const { getProjects } = await import('./get-projects');
    const result = await getProjects();

    expect(result).toEqual([]);
  });

  it('should return projects with metrics when data exists', async () => {
    const project = makeProject({ id: 'proj-1' });
    const projectsChain = chain({ data: [project] });

    const surveysChain = chain({
      data: [
        {
          id: 's1',
          project_id: 'proj-1',
          status: 'completed',
          survey_responses: [{ count: 10 }],
        },
        {
          id: 's2',
          project_id: 'proj-1',
          status: 'draft',
          survey_responses: [{ count: 3 }],
        },
      ],
    });

    mockFrom.mockImplementation((table: string) => {
      if (table === 'surveys') {
        return surveysChain;
      }

      return projectsChain;
    });

    const { getProjects } = await import('./get-projects');
    const result = await getProjects();

    expect(result).toHaveLength(1);
    expect(result?.[0]).toMatchObject({
      id: 'proj-1',
      surveyCount: 2,
      responseCount: 13,
    });
  });
});
