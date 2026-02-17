/** Password config: strength scoring and individual requirement validators. */
import { describe, expect, it } from 'vitest';

import { PASSWORD_CONFIG, calculatePasswordStrength } from './password';

describe('PASSWORD_CONFIG.REQUIREMENTS', () => {
  it('should pass LENGTH when >= 8 chars', () => {
    expect(PASSWORD_CONFIG.REQUIREMENTS.LENGTH('1234567')).toBe(false);
    expect(PASSWORD_CONFIG.REQUIREMENTS.LENGTH('12345678')).toBe(true);
  });

  it('should pass UPPER when has uppercase letter', () => {
    expect(PASSWORD_CONFIG.REQUIREMENTS.UPPER('abc')).toBe(false);
    expect(PASSWORD_CONFIG.REQUIREMENTS.UPPER('Abc')).toBe(true);
  });

  it('should pass LOWER when has lowercase letter', () => {
    expect(PASSWORD_CONFIG.REQUIREMENTS.LOWER('ABC')).toBe(false);
    expect(PASSWORD_CONFIG.REQUIREMENTS.LOWER('ABc')).toBe(true);
  });

  it('should pass NUMBER when has digit', () => {
    expect(PASSWORD_CONFIG.REQUIREMENTS.NUMBER('abc')).toBe(false);
    expect(PASSWORD_CONFIG.REQUIREMENTS.NUMBER('abc1')).toBe(true);
  });

  it('should pass SPECIAL when has non-alphanumeric char', () => {
    expect(PASSWORD_CONFIG.REQUIREMENTS.SPECIAL('abc123')).toBe(false);
    expect(PASSWORD_CONFIG.REQUIREMENTS.SPECIAL('abc!')).toBe(true);
  });

  it('should pass EXTENDED when >= 12 chars', () => {
    expect(PASSWORD_CONFIG.REQUIREMENTS.EXTENDED('12345678901')).toBe(false);
    expect(PASSWORD_CONFIG.REQUIREMENTS.EXTENDED('123456789012')).toBe(true);
  });
});

describe('calculatePasswordStrength', () => {
  it('should return 0 for empty password', () => {
    expect(calculatePasswordStrength('')).toBe(0);
  });

  // Only meets LOWER requirement
  it('should return low score for weak password', () => {
    expect(calculatePasswordStrength('abc')).toBe(0);
  });

  // Meets LENGTH + LOWER + UPPER
  it('should return medium score for moderate password', () => {
    expect(calculatePasswordStrength('Abcdefgh')).toBe(2);
  });

  // Meets LENGTH + LOWER + UPPER + NUMBER
  it('should return higher score with number added', () => {
    expect(calculatePasswordStrength('Abcdefg1')).toBe(3);
  });

  // Meets all 5 base requirements
  it('should return 4 for strong password without extended length', () => {
    expect(calculatePasswordStrength('Abcdef1!')).toBe(4);
  });

  // Meets all 6 requirements including EXTENDED
  it('should return max score 5 for strong extended password', () => {
    expect(calculatePasswordStrength('Abcdefghij1!')).toBe(5);
  });

  it('should never exceed 5', () => {
    expect(calculatePasswordStrength('AaaaBbbbcccc1!')).toBe(5);
  });
});
