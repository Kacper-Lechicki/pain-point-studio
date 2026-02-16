import { describe, expect, it, vi } from 'vitest';

import { BRAND, getCopyrightText } from './brand';

// ── BRAND ──────────────────────────────────────────────────────────

describe('BRAND', () => {
  it('has expected translation keys', () => {
    expect(BRAND.name).toBe('brand.name');
    expect(BRAND.tagline).toBe('brand.tagline');
    expect(BRAND.author).toBe('brand.author');
  });
});

// ── getCopyrightText ───────────────────────────────────────────────

describe('getCopyrightText', () => {
  it('returns copyright text with provided year', () => {
    const t = vi.fn((key: string, values?: Record<string, unknown>) => {
      if (key === 'brand.author') {
        return 'Test Author';
      }

      if (key === 'brand.copyright') {
        return `\u00A9 ${values?.year} ${values?.author}`;
      }

      return key;
    });

    const result = getCopyrightText(t as never, 2025);

    expect(result).toBe('\u00A9 2025 Test Author');
  });

  it('uses current year when no year provided', () => {
    const currentYear = new Date().getFullYear();
    const t = vi.fn((key: string, values?: Record<string, unknown>) => {
      if (key === 'brand.author') {
        return 'Test Author';
      }

      if (key === 'brand.copyright') {
        return `\u00A9 ${values?.year} ${values?.author}`;
      }

      return key;
    });

    const result = getCopyrightText(t as never);

    expect(result).toBe(`\u00A9 ${currentYear} Test Author`);
  });

  it('calls t with correct keys', () => {
    const t = vi.fn(() => 'mock');

    getCopyrightText(t as never, 2024);

    expect(t).toHaveBeenCalledWith('brand.author');
    expect(t).toHaveBeenCalledWith('brand.copyright', {
      year: 2024,
      author: 'mock',
    });
  });
});
