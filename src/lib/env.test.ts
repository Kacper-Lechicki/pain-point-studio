// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('Environment Configuration', () => {
  // Reset isolated modules and environment stubs before each test
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  // Clean up all environment stubs after each test finish
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  // Test successful validation of correctly formatted environment variables
  it('should validate valid environment variables', async () => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://example.com');
    vi.stubEnv('NODE_ENV', 'test');

    const { env } = await import('./env');

    expect(env.NEXT_PUBLIC_APP_URL).toBe('https://example.com');
    expect(env.NODE_ENV).toBe('test');
  });

  // Test that an invalid URL format triggers a validation error
  it('should throw error for invalid URL', async () => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'not-a-url');
    vi.stubEnv('NODE_ENV', 'test');

    await expect(import('./env')).rejects.toThrow();
  });

  // Test that missing required environment variables trigger a validation error
  it('should throw error when missing required variables', async () => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', '');
    vi.stubEnv('NODE_ENV', 'test');

    await expect(import('./env')).rejects.toThrow();
  });
});
