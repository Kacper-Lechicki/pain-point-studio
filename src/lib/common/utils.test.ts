/** Utility functions: cn class merging, initials extraction, and image proxying. */
import { describe, expect, it } from 'vitest';

import { cn, getInitials, proxyImageUrl } from './utils';

describe('cn', () => {
  it('should merge class names correctly', () => {
    expect(cn('text-red-500', 'bg-blue-500')).toBe('text-red-500 bg-blue-500');
  });

  it('should handle conditional classes', () => {
    expect(cn('text-red-500', true && 'bg-blue-500')).toBe('text-red-500 bg-blue-500');
  });

  it('should merge tailwind classes properly', () => {
    expect(cn('p-4', 'p-2')).toBe('p-2');
  });
});

describe('getInitials', () => {
  it('should return initials from a full name', () => {
    expect(getInitials('John Doe', 'JD')).toBe('JD');
  });

  it('should return first two initials for names with more than two words', () => {
    expect(getInitials('John Michael Doe', 'JM')).toBe('JM');
  });

  it('should return single initial for single-word name', () => {
    expect(getInitials('John', 'J')).toBe('J');
  });

  it('should uppercase initials', () => {
    expect(getInitials('john doe', 'jd')).toBe('JD');
  });

  it('should use fallback when name is empty', () => {
    expect(getInitials('', 'FB')).toBe('FB');
  });

  it('should uppercase and truncate fallback to 2 characters', () => {
    expect(getInitials('', 'fallback')).toBe('FA');
  });
});

describe('proxyImageUrl', () => {
  it('should return undefined for undefined input', () => {
    expect(proxyImageUrl(undefined)).toBeUndefined();
  });

  it('should return localhost URLs unchanged', () => {
    expect(proxyImageUrl('http://localhost:3000/avatar.png')).toBe(
      'http://localhost:3000/avatar.png'
    );
  });

  it('should return 127.0.0.1 URLs unchanged', () => {
    expect(proxyImageUrl('http://127.0.0.1:54321/storage/avatar.png')).toBe(
      'http://127.0.0.1:54321/storage/avatar.png'
    );
  });

  it('should proxy external URLs through Next.js image optimization', () => {
    const url = 'https://lh3.googleusercontent.com/photo.jpg';
    const result = proxyImageUrl(url);

    expect(result).toBe(`/_next/image?url=${encodeURIComponent(url)}&w=384&q=75`);
  });

  it('should accept custom width and quality', () => {
    const url = 'https://example.com/photo.jpg';
    const result = proxyImageUrl(url, 128, 90);

    expect(result).toBe(`/_next/image?url=${encodeURIComponent(url)}&w=128&q=90`);
  });

  it('should return relative URLs unchanged (resolved as localhost)', () => {
    expect(proxyImageUrl('/uploads/avatar.png')).toBe('/uploads/avatar.png');
  });

  it('should return invalid URLs as-is', () => {
    expect(proxyImageUrl('not a url at all :///')).toBe('not a url at all :///');
  });
});
