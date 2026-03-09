import { vi } from 'vitest';

export function chain(result: { data?: unknown; error?: unknown } = {}) {
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

export const TEST_USER = { id: 'user-123', email: 'test@example.com' };
export const TEST_PROJECT_ID = '00000000-0000-4000-8000-000000000001';
export const TEST_NOTE_ID = '00000000-0000-4000-8000-000000000020';
export const TEST_FOLDER_ID = '00000000-0000-4000-8000-000000000030';
export const TEST_INSIGHT_ID = '00000000-0000-4000-8000-000000000010';
export const TEST_SURVEY_ID = '00000000-0000-4000-8000-000000000040';
