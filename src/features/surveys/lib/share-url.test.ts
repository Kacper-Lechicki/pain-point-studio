import { describe, expect, it, vi } from 'vitest';

import { getSurveyShareUrl } from './share-url';

vi.mock('@/lib/common/env', () => ({
  env: { NEXT_PUBLIC_APP_URL: 'https://example.com' },
}));

// ── getSurveyShareUrl ───────────────────────────────────────────────

describe('getSurveyShareUrl', () => {
  it('constructs URL with English locale', () => {
    expect(getSurveyShareUrl('en', 'my-survey')).toBe('https://example.com/en/r/my-survey');
  });

  it('constructs URL with Polish locale', () => {
    expect(getSurveyShareUrl('pl', 'ankieta')).toBe('https://example.com/pl/r/ankieta');
  });

  it('handles slugs with special characters', () => {
    expect(getSurveyShareUrl('en', 'slug-with-123')).toBe('https://example.com/en/r/slug-with-123');
  });
});
