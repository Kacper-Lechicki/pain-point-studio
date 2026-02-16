// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { z } from 'zod';

import { saveAnswerSchema } from '@/features/surveys/types';

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

const mockRpc = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({ rpc: mockRpc }),
}));

// ── Helpers ──────────────────────────────────────────────────────────

const VALID_INPUT = {
  responseId: crypto.randomUUID(),
  questionId: crypto.randomUUID(),
  value: { text: 'My answer' },
};

// ── Tests ────────────────────────────────────────────────────────────

describe('saveAnswer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  // RPC success → success; rpc called with p_response_id, p_question_id, p_value.
  it('saves answer successfully', async () => {
    mockRpc.mockResolvedValue({ data: null, error: null });

    const { saveAnswer } = await import('./save-answer');
    const result = await saveAnswer(VALID_INPUT);

    expect(result).toEqual({ success: true });
    expect(mockRpc).toHaveBeenCalledWith('validate_and_save_answer', {
      p_response_id: VALID_INPUT.responseId,
      p_question_id: VALID_INPUT.questionId,
      p_value: VALID_INPUT.value,
    });
  });

  // RPC returns error (e.g. QUESTION_NOT_FOUND) → error with respondent. prefix; no success.
  it('returns error with mapped RPC error code', async () => {
    mockRpc.mockResolvedValue({
      data: null,
      error: { message: 'QUESTION_NOT_FOUND' },
    });

    const { saveAnswer } = await import('./save-answer');
    const result = await saveAnswer(VALID_INPUT);

    expect(result.error).toBeDefined();
    expect(result.error).toContain('respondent.');
    expect(result).not.toHaveProperty('success');
  });

  // Invalid input (e.g. missing responseId) → validation error; rpc not called.
  it('returns validation error for invalid data', async () => {
    const { saveAnswer } = await import('./save-answer');
    const invalidPayload = {
      questionId: crypto.randomUUID(),
      value: {},
    } as z.infer<typeof saveAnswerSchema>;
    const result = await saveAnswer(invalidPayload);

    expect(result.error).toBeDefined();
    expect(mockRpc).not.toHaveBeenCalled();
  });
});
