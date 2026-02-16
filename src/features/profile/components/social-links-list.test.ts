import { describe, expect, it } from 'vitest';

import { getDisplayUrl } from './social-links-list';

describe('getDisplayUrl', () => {
  it('strips protocol and www prefix', () => {
    expect(getDisplayUrl('https://www.example.com')).toBe('example.com');
  });

  it('keeps hostname without www', () => {
    expect(getDisplayUrl('https://github.com')).toBe('github.com');
  });

  it('includes path when present', () => {
    expect(getDisplayUrl('https://github.com/user')).toBe('github.com/user');
  });

  it('strips trailing slash from path', () => {
    expect(getDisplayUrl('https://example.com/about/')).toBe('example.com/about');
  });

  it('handles root path with trailing slash', () => {
    expect(getDisplayUrl('https://example.com/')).toBe('example.com');
  });

  it('returns raw string for invalid URLs', () => {
    expect(getDisplayUrl('not-a-url')).toBe('not-a-url');
  });

  it('handles http protocol', () => {
    expect(getDisplayUrl('http://example.com/page')).toBe('example.com/page');
  });

  it('preserves nested paths', () => {
    expect(getDisplayUrl('https://example.com/a/b/c')).toBe('example.com/a/b/c');
  });
});
