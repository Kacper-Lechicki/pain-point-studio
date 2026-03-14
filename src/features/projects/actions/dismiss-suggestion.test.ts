// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { z } from 'zod';

import { dismissSuggestionSchema } from '@/features/projects/types';
import {
  TEST_PROJECT_ID as PROJECT_ID,
  TEST_USER as USER,
  chain,
} from '@/test-utils/action-helpers';

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

const VALID_INPUT: z.infer<typeof dismissSuggestionSchema> = {
  projectId: PROJECT_ID,
  signature: 'survey-1:q-1:yes_no',
};

describe('Project Actions – Dismiss Suggestion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: USER } });
  });

  it('should dismiss suggestion and return success', async () => {
    const projectChain = chain({ data: { id: PROJECT_ID } });
    const upsertChain = chain();

    mockFrom.mockReturnValueOnce(projectChain).mockReturnValueOnce(upsertChain);

    const { dismissSuggestion } = await import('./dismiss-suggestion');
    const result = await dismissSuggestion(VALID_INPUT);

    expect(result).toEqual({ success: true });
    expect(mockFrom).toHaveBeenCalledWith('projects');
    expect(mockFrom).toHaveBeenCalledWith('insight_suggestion_actions');
  });

  it('should return error when project not found (ownership fail)', async () => {
    mockFrom.mockReturnValueOnce(chain({ data: null }));

    const { dismissSuggestion } = await import('./dismiss-suggestion');
    const result = await dismissSuggestion(VALID_INPUT);

    expect(result).toHaveProperty('error', 'projects.errors.unexpected');
    expect(mockFrom).toHaveBeenCalledTimes(1);
  });

  it('should return error on upsert failure', async () => {
    const projectChain = chain({ data: { id: PROJECT_ID } });
    const upsertChain = chain({ error: { message: 'Upsert failed' } });

    mockFrom.mockReturnValueOnce(projectChain).mockReturnValueOnce(upsertChain);

    const { dismissSuggestion } = await import('./dismiss-suggestion');
    const result = await dismissSuggestion(VALID_INPUT);

    expect(result).toHaveProperty('error', 'projects.errors.unexpected');
  });

  it('should return validation error for invalid data', async () => {
    const { dismissSuggestion } = await import('./dismiss-suggestion');

    const result = await dismissSuggestion({ projectId: 'not-a-uuid' } as z.infer<
      typeof dismissSuggestionSchema
    >);

    expect(result.error).toBeDefined();
    expect(mockFrom).not.toHaveBeenCalled();
  });
});
