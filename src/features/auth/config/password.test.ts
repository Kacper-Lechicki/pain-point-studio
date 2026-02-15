import { describe, expect, it } from 'vitest';

import { PASSWORD_CONFIG, calculatePasswordStrength } from './password';

describe('PASSWORD_CONFIG.REQUIREMENTS', () => {
  // Each requirement checker returns true only when the condition is met.
  it('LENGTH: true when >= 8 chars', () => {
    expect(PASSWORD_CONFIG.REQUIREMENTS.LENGTH('1234567')).toBe(false);
    expect(PASSWORD_CONFIG.REQUIREMENTS.LENGTH('12345678')).toBe(true);
  });

  it('UPPER: true when has uppercase letter', () => {
    expect(PASSWORD_CONFIG.REQUIREMENTS.UPPER('abc')).toBe(false);
    expect(PASSWORD_CONFIG.REQUIREMENTS.UPPER('Abc')).toBe(true);
  });

  it('LOWER: true when has lowercase letter', () => {
    expect(PASSWORD_CONFIG.REQUIREMENTS.LOWER('ABC')).toBe(false);
    expect(PASSWORD_CONFIG.REQUIREMENTS.LOWER('ABc')).toBe(true);
  });

  it('NUMBER: true when has digit', () => {
    expect(PASSWORD_CONFIG.REQUIREMENTS.NUMBER('abc')).toBe(false);
    expect(PASSWORD_CONFIG.REQUIREMENTS.NUMBER('abc1')).toBe(true);
  });

  it('SPECIAL: true when has non-alphanumeric char', () => {
    expect(PASSWORD_CONFIG.REQUIREMENTS.SPECIAL('abc123')).toBe(false);
    expect(PASSWORD_CONFIG.REQUIREMENTS.SPECIAL('abc!')).toBe(true);
  });

  it('EXTENDED: true when >= 12 chars', () => {
    expect(PASSWORD_CONFIG.REQUIREMENTS.EXTENDED('12345678901')).toBe(false);
    expect(PASSWORD_CONFIG.REQUIREMENTS.EXTENDED('123456789012')).toBe(true);
  });
});

describe('calculatePasswordStrength', () => {
  // Empty string yields 0.
  it('should return 0 for empty password', () => {
    expect(calculatePasswordStrength('')).toBe(0);
  });

  // Short lowercase-only password meets only one requirement (lower).
  it('should return low score for weak password', () => {
    expect(calculatePasswordStrength('abc')).toBe(0);
  });

  // Meets length + lower + upper = 3 requirements → score 2.
  it('should return medium score for moderate password', () => {
    expect(calculatePasswordStrength('Abcdefgh')).toBe(2);
  });

  // Meets length + lower + upper + number = 4 → score 3.
  it('should return higher score with number added', () => {
    expect(calculatePasswordStrength('Abcdefg1')).toBe(3);
  });

  // Meets all 5 base requirements (length, upper, lower, number, special) → score 4.
  it('should return 4 for strong password without extended length', () => {
    expect(calculatePasswordStrength('Abcdef1!')).toBe(4);
  });

  // Meets all 6 requirements (including extended 12+ chars) → capped at 5.
  it('should return max score 5 for strong extended password', () => {
    expect(calculatePasswordStrength('Abcdefghij1!')).toBe(5);
  });

  // Score never exceeds 5, even if somehow all conditions are met.
  it('should never exceed 5', () => {
    expect(calculatePasswordStrength('AaaaBbbbcccc1!')).toBe(5);
  });
});
