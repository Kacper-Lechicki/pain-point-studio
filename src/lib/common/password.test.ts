// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { PASSWORD_CONFIG, basePasswordSchema, calculatePasswordStrength } from './password';

// ── calculatePasswordStrength ───────────────────────────────────────

describe('calculatePasswordStrength', () => {
  it('returns 0 for empty string', () => {
    expect(calculatePasswordStrength('')).toBe(0);
  });

  it('returns 0 for short lowercase-only password', () => {
    expect(calculatePasswordStrength('abc')).toBe(0);
  });

  it('returns low score for password meeting only length + lowercase', () => {
    expect(calculatePasswordStrength('abcdefgh')).toBe(1);
  });

  it('returns higher score with upper + lower + number', () => {
    expect(calculatePasswordStrength('Abcdefg1')).toBe(3);
  });

  it('returns max 5 for password meeting all criteria', () => {
    expect(calculatePasswordStrength('Abcdefgh1!extra')).toBe(5);
  });

  it('scores extended length bonus for >= 12 characters', () => {
    const short = calculatePasswordStrength('Abcdefg1!');
    const long = calculatePasswordStrength('Abcdefghij1!');

    expect(long).toBeGreaterThan(short);
  });
});

// ── PASSWORD_CONFIG.REQUIREMENTS ────────────────────────────────────

describe('PASSWORD_CONFIG.REQUIREMENTS', () => {
  it('LENGTH requires >= 8 characters', () => {
    expect(PASSWORD_CONFIG.REQUIREMENTS.LENGTH('1234567')).toBe(false);
    expect(PASSWORD_CONFIG.REQUIREMENTS.LENGTH('12345678')).toBe(true);
  });

  it('UPPER requires an uppercase letter', () => {
    expect(PASSWORD_CONFIG.REQUIREMENTS.UPPER('abc')).toBe(false);
    expect(PASSWORD_CONFIG.REQUIREMENTS.UPPER('Abc')).toBe(true);
  });

  it('LOWER requires a lowercase letter', () => {
    expect(PASSWORD_CONFIG.REQUIREMENTS.LOWER('ABC')).toBe(false);
    expect(PASSWORD_CONFIG.REQUIREMENTS.LOWER('ABc')).toBe(true);
  });

  it('NUMBER requires a digit', () => {
    expect(PASSWORD_CONFIG.REQUIREMENTS.NUMBER('abc')).toBe(false);
    expect(PASSWORD_CONFIG.REQUIREMENTS.NUMBER('abc1')).toBe(true);
  });

  it('SPECIAL requires a non-alphanumeric character', () => {
    expect(PASSWORD_CONFIG.REQUIREMENTS.SPECIAL('abc1')).toBe(false);
    expect(PASSWORD_CONFIG.REQUIREMENTS.SPECIAL('abc!')).toBe(true);
  });

  it('EXTENDED requires >= 12 characters', () => {
    expect(PASSWORD_CONFIG.REQUIREMENTS.EXTENDED('12345678901')).toBe(false);
    expect(PASSWORD_CONFIG.REQUIREMENTS.EXTENDED('123456789012')).toBe(true);
  });
});

// ── basePasswordSchema ──────────────────────────────────────────────

describe('basePasswordSchema', () => {
  it('rejects passwords shorter than 8 characters', () => {
    expect(basePasswordSchema.safeParse('Ab1!xyz').success).toBe(false);
  });

  it('rejects passwords without uppercase', () => {
    expect(basePasswordSchema.safeParse('abcdefg1!').success).toBe(false);
  });

  it('rejects passwords without lowercase', () => {
    expect(basePasswordSchema.safeParse('ABCDEFG1!').success).toBe(false);
  });

  it('rejects passwords without a digit', () => {
    expect(basePasswordSchema.safeParse('Abcdefgh!').success).toBe(false);
  });

  it('rejects passwords without a special character', () => {
    expect(basePasswordSchema.safeParse('Abcdefg1').success).toBe(false);
  });

  it('accepts a valid password', () => {
    expect(basePasswordSchema.safeParse('Abcdefg1!').success).toBe(true);
  });
});
