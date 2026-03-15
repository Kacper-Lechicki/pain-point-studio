// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

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

const mockHeadersMap = new Map<string, string>();
const mockCookieStore = new Map<string, string>();
const mockSetCookie = vi.fn();

vi.mock('next/headers', () => ({
  headers: vi.fn().mockImplementation(() =>
    Promise.resolve({
      get: (key: string) => mockHeadersMap.get(key) ?? null,
    })
  ),
  cookies: vi.fn().mockImplementation(() =>
    Promise.resolve({
      get: (name: string) => {
        const value = mockCookieStore.get(name);

        return value ? { value } : undefined;
      },
      set: mockSetCookie,
    })
  ),
}));

const mockRpc = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({ rpc: mockRpc }),
}));

const SURVEY_ID = crypto.randomUUID();
const RESPONSE_ID = crypto.randomUUID();

describe('startResponse', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    mockHeadersMap.clear();
    mockCookieStore.clear();
  });

  it('should start response successfully and return responseId', async () => {
    mockRpc.mockResolvedValue({ data: RESPONSE_ID, error: null });

    const { startResponse } = await import('./start-response');
    const result = await startResponse({ surveyId: SURVEY_ID });

    expect(result).toEqual({ success: true, data: { responseId: RESPONSE_ID } });

    expect(mockRpc).toHaveBeenCalledWith(
      'start_survey_response',
      expect.objectContaining({ p_survey_id: SURVEY_ID })
    );
  });

  it('should pass deviceType to RPC when provided', async () => {
    mockRpc.mockResolvedValue({ data: RESPONSE_ID, error: null });

    const { startResponse } = await import('./start-response');

    await startResponse({ surveyId: SURVEY_ID, deviceType: 'mobile' });

    expect(mockRpc).toHaveBeenCalledWith(
      'start_survey_response',
      expect.objectContaining({
        p_survey_id: SURVEY_ID,
        p_device_type: 'mobile',
      })
    );
  });

  it('should not pass p_device_type when deviceType is omitted', async () => {
    mockRpc.mockResolvedValue({ data: RESPONSE_ID, error: null });

    const { startResponse } = await import('./start-response');

    await startResponse({ surveyId: SURVEY_ID });

    const firstCall = mockRpc.mock.calls[0];

    expect(firstCall).toBeDefined();

    const rpcArgs = firstCall?.[1];

    expect(rpcArgs).not.toHaveProperty('p_device_type');
  });

  it('should return mapped error on RPC failure', async () => {
    mockRpc.mockResolvedValue({
      data: null,
      error: { message: 'SURVEY_NOT_FOUND' },
    });

    const { startResponse } = await import('./start-response');
    const result = await startResponse({ surveyId: SURVEY_ID });

    expect(result.error).toBeDefined();
    expect(result.error).toContain('respondent.');
    expect(result).not.toHaveProperty('success');
  });

  describe('fingerprint', () => {
    it('should compute fingerprint with all headers including accept-language and accept-encoding', async () => {
      mockHeadersMap.set('x-forwarded-for', '10.0.0.1');
      mockHeadersMap.set('user-agent', 'TestAgent/1.0');
      mockHeadersMap.set('accept-language', 'en-US');
      mockHeadersMap.set('accept-encoding', 'gzip, br');
      mockRpc.mockResolvedValue({ data: RESPONSE_ID, error: null });

      const { startResponse } = await import('./start-response');
      await startResponse({ surveyId: SURVEY_ID });

      const rpcArgs = mockRpc.mock.calls[0]?.[1];

      expect(rpcArgs).toHaveProperty('p_fingerprint');
      expect(typeof rpcArgs.p_fingerprint).toBe('string');
      expect(rpcArgs.p_fingerprint.length).toBe(64);
    });

    it('should fall back to cookie when IP is missing', async () => {
      const existingFp = 'a'.repeat(64);
      mockCookieStore.set('__fp', existingFp);
      mockRpc.mockResolvedValue({ data: RESPONSE_ID, error: null });

      const { startResponse } = await import('./start-response');
      await startResponse({ surveyId: SURVEY_ID });

      const rpcArgs = mockRpc.mock.calls[0]?.[1];

      expect(rpcArgs).toHaveProperty('p_fingerprint', existingFp);
    });

    it('should generate and set cookie fingerprint when IP and cookie are both missing', async () => {
      mockRpc.mockResolvedValue({ data: RESPONSE_ID, error: null });

      const { startResponse } = await import('./start-response');
      await startResponse({ surveyId: SURVEY_ID });

      expect(mockSetCookie).toHaveBeenCalledWith(
        '__fp',
        expect.any(String),
        expect.objectContaining({
          httpOnly: true,
          secure: true,
          sameSite: 'lax',
          path: '/',
        })
      );

      const rpcArgs = mockRpc.mock.calls[0]?.[1];

      expect(rpcArgs).toHaveProperty('p_fingerprint');
      expect(typeof rpcArgs.p_fingerprint).toBe('string');
      expect(rpcArgs.p_fingerprint.length).toBe(64);
    });

    it('should return consistent fingerprint from cookie across requests', async () => {
      const existingFp = 'b'.repeat(64);
      mockCookieStore.set('__fp', existingFp);
      mockRpc.mockResolvedValue({ data: RESPONSE_ID, error: null });

      const { startResponse } = await import('./start-response');

      await startResponse({ surveyId: SURVEY_ID });
      await startResponse({ surveyId: SURVEY_ID });

      const fp1 = mockRpc.mock.calls[0]?.[1]?.p_fingerprint;
      const fp2 = mockRpc.mock.calls[1]?.[1]?.p_fingerprint;

      expect(fp1).toBe(existingFp);
      expect(fp2).toBe(existingFp);
    });
  });
});
