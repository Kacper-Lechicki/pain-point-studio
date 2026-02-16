import { describe, expect, it } from 'vitest';

import { cn, getInitials, proxyImageUrl } from './utils';

describe('cn', () => {
  // Multiple class strings are concatenated.
  it('should merge class names correctly', () => {
    expect(cn('text-red-500', 'bg-blue-500')).toBe('text-red-500 bg-blue-500');
  });

  // Falsy values are dropped; truthy expressions yield their class.
  it('should handle conditional classes', () => {
    expect(cn('text-red-500', true && 'bg-blue-500')).toBe('text-red-500 bg-blue-500');
  });

  // Conflicting Tailwind classes are resolved (later wins via tailwind-merge).
  it('should merge tailwind classes properly', () => {
    expect(cn('p-4', 'p-2')).toBe('p-2');
  });
});

describe('getInitials', () => {
  // Two words yield two uppercase initials.
  it('should return initials from a full name', () => {
    expect(getInitials('John Doe', 'JD')).toBe('JD');
  });

  // Only first two initials are kept when name has more than two words.
  it('should return first two initials for names with more than two words', () => {
    expect(getInitials('John Michael Doe', 'JM')).toBe('JM');
  });

  // Single word yields one initial.
  it('should return single initial for single-word name', () => {
    expect(getInitials('John', 'J')).toBe('J');
  });

  // Initials are always uppercase.
  it('should uppercase initials', () => {
    expect(getInitials('john doe', 'jd')).toBe('JD');
  });

  // Empty name uses fallback (first 2 chars, uppercased).
  it('should use fallback when name is empty', () => {
    expect(getInitials('', 'FB')).toBe('FB');
  });

  // Fallback longer than 2 chars is truncated and uppercased.
  it('should uppercase and truncate fallback to 2 characters', () => {
    expect(getInitials('', 'fallback')).toBe('FA');
  });
});

describe('proxyImageUrl', () => {
  // Undefined input returns undefined.
  it('should return undefined for undefined input', () => {
    expect(proxyImageUrl(undefined)).toBeUndefined();
  });

  // localhost hostname is not proxied (passed through).
  it('should return localhost URLs unchanged', () => {
    expect(proxyImageUrl('http://localhost:3000/avatar.png')).toBe(
      'http://localhost:3000/avatar.png'
    );
  });

  // 127.0.0.1 hostname is not proxied (passed through).
  it('should return 127.0.0.1 URLs unchanged', () => {
    expect(proxyImageUrl('http://127.0.0.1:54321/storage/avatar.png')).toBe(
      'http://127.0.0.1:54321/storage/avatar.png'
    );
  });

  // External URLs get /_next/image?url=... with default w and q.
  it('should proxy external URLs through Next.js image optimization', () => {
    const url = 'https://lh3.googleusercontent.com/photo.jpg';
    const result = proxyImageUrl(url);

    expect(result).toBe(`/_next/image?url=${encodeURIComponent(url)}&w=384&q=75`);
  });

  // Custom width and quality are applied in the proxy URL.
  it('should accept custom width and quality', () => {
    const url = 'https://example.com/photo.jpg';
    const result = proxyImageUrl(url, 128, 90);

    expect(result).toBe(`/_next/image?url=${encodeURIComponent(url)}&w=128&q=90`);
  });

  // Relative URLs resolve to localhost and are returned as-is.
  it('should return relative URLs unchanged (resolved as localhost)', () => {
    expect(proxyImageUrl('/uploads/avatar.png')).toBe('/uploads/avatar.png');
  });

  // Invalid URL string is returned unchanged (no throw).
  it('should return invalid URLs as-is', () => {
    expect(proxyImageUrl('not a url at all :///')).toBe('not a url at all :///');
  });
});
