// @vitest-environment node
/** Tests for retrieving translated survey form data. */
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

vi.mock('next-intl/server', () => ({
  getTranslations: vi.fn().mockResolvedValue((key: string) => key),
}));

// Ensure createClient path doesn't trigger env; from() returns empty projects by default
beforeEach(() => {
  mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
  mockFrom.mockReturnValue({
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockResolvedValue({ data: [] }),
  });
});

// ── Tests ────────────────────────────────────────────────────────────

describe('getSurveyFormData', () => {
  it('should return projectOptions array', async () => {
    const { getSurveyFormData } = await import('./get-survey-form-data');
    const result = await getSurveyFormData();

    expect(result).toBeDefined();
    expect(result).toHaveProperty('projectOptions');
    expect(Array.isArray(result!.projectOptions)).toBe(true);
  });

  it('should return project options from database', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: [
          { id: 'p1', name: 'Project One' },
          { id: 'p2', name: 'Project Two' },
        ],
      }),
    });

    const { getSurveyFormData } = await import('./get-survey-form-data');
    const result = await getSurveyFormData();

    expect(result).toBeDefined();
    expect(result!.projectOptions).toHaveLength(2);
  });
});
