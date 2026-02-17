/** Tests for getDisplayUrl which formats full URLs into clean display strings. */
import { describe, expect, it } from 'vitest';

import { getDisplayUrl } from './social-links-list';

describe('getDisplayUrl', () => {
  it('should strip protocol and www prefix', () => {
    expect(getDisplayUrl('https://www.example.com')).toBe('example.com');
  });

  it('should keep hostname without www', () => {
    expect(getDisplayUrl('https://github.com')).toBe('github.com');
  });

  it('should include path when present', () => {
    expect(getDisplayUrl('https://github.com/user')).toBe('github.com/user');
  });

  it('should strip trailing slash from path', () => {
    expect(getDisplayUrl('https://example.com/about/')).toBe('example.com/about');
  });

  it('should handle root path with trailing slash', () => {
    expect(getDisplayUrl('https://example.com/')).toBe('example.com');
  });

  it('should return raw string for invalid URLs', () => {
    expect(getDisplayUrl('not-a-url')).toBe('not-a-url');
  });

  it('should handle http protocol', () => {
    expect(getDisplayUrl('http://example.com/page')).toBe('example.com/page');
  });

  it('should preserve nested paths', () => {
    expect(getDisplayUrl('https://example.com/a/b/c')).toBe('example.com/a/b/c');
  });
});
