/** Tests for getSurveyShareUrl locale-prefixed URL construction. */
import { describe, expect, it, vi } from 'vitest';

import { getSurveyShareUrl } from './share-url';

vi.mock('@/lib/common/env', () => ({
  env: { NEXT_PUBLIC_APP_URL: 'https://example.com' },
}));

describe('getSurveyShareUrl', () => {
  it('should construct URL with English locale', () => {
    expect(getSurveyShareUrl('en', 'my-survey')).toBe('https://example.com/en/r/my-survey');
  });

  it('should construct URL with Polish locale', () => {
    expect(getSurveyShareUrl('pl', 'ankieta')).toBe('https://example.com/pl/r/ankieta');
  });

  it('should handle slugs with special characters', () => {
    expect(getSurveyShareUrl('en', 'slug-with-123')).toBe('https://example.com/en/r/slug-with-123');
  });
});
