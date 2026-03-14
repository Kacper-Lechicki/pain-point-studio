// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { z } from 'zod';

import { acceptSuggestionSchema } from '@/features/projects/types';
import {
  TEST_INSIGHT_ID as INSIGHT_ID,
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

const VALID_INPUT: z.infer<typeof acceptSuggestionSchema> = {
  projectId: PROJECT_ID,
  signature: 'survey-1:q-1:yes_no',
  type: 'strength',
  content: 'Most users confirmed the problem exists',
};

describe('Project Actions – Accept Suggestion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: USER } });
  });

  it('should accept suggestion and return insight id', async () => {
    const projectChain = chain({ data: { id: PROJECT_ID } });
    const sortOrderChain = chain({ data: { sort_order: 2 } });
    const insightChain = chain({ data: { id: INSIGHT_ID } });
    const upsertChain = chain();

    mockFrom
      .mockReturnValueOnce(projectChain)
      .mockReturnValueOnce(sortOrderChain)
      .mockReturnValueOnce(insightChain)
      .mockReturnValueOnce(upsertChain);

    const { acceptSuggestion } = await import('./accept-suggestion');
    const result = await acceptSuggestion(VALID_INPUT);

    expect(result).toEqual({ success: true, data: { insightId: INSIGHT_ID } });
    expect(mockFrom).toHaveBeenCalledWith('projects');
    expect(mockFrom).toHaveBeenCalledWith('project_insights');
    expect(mockFrom).toHaveBeenCalledWith('insight_suggestion_actions');
  });

  it('should return error when project not found (ownership fail)', async () => {
    mockFrom.mockReturnValueOnce(chain({ data: null }));

    const { acceptSuggestion } = await import('./accept-suggestion');
    const result = await acceptSuggestion(VALID_INPUT);

    expect(result).toHaveProperty('error', 'projects.errors.unexpected');
    expect(mockFrom).toHaveBeenCalledTimes(1);
  });

  it('should return error on insert failure', async () => {
    const projectChain = chain({ data: { id: PROJECT_ID } });
    const sortOrderChain = chain({ data: null });
    const insightChain = chain({ data: null, error: { message: 'Insert failed' } });

    mockFrom
      .mockReturnValueOnce(projectChain)
      .mockReturnValueOnce(sortOrderChain)
      .mockReturnValueOnce(insightChain);

    const { acceptSuggestion } = await import('./accept-suggestion');
    const result = await acceptSuggestion(VALID_INPUT);

    expect(result).toHaveProperty('error', 'projects.errors.unexpected');
  });

  it('should return error when insert returns null data', async () => {
    const projectChain = chain({ data: { id: PROJECT_ID } });
    const sortOrderChain = chain({ data: null });
    const insightChain = chain({ data: null, error: null });

    mockFrom
      .mockReturnValueOnce(projectChain)
      .mockReturnValueOnce(sortOrderChain)
      .mockReturnValueOnce(insightChain);

    const { acceptSuggestion } = await import('./accept-suggestion');
    const result = await acceptSuggestion(VALID_INPUT);

    expect(result).toHaveProperty('error', 'projects.errors.unexpected');
  });

  it('should return validation error for invalid data', async () => {
    const { acceptSuggestion } = await import('./accept-suggestion');

    const result = await acceptSuggestion({ projectId: 'not-a-uuid' } as z.infer<
      typeof acceptSuggestionSchema
    >);

    expect(result.error).toBeDefined();
    expect(mockFrom).not.toHaveBeenCalled();
  });
});
