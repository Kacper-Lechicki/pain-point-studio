import { z } from 'zod';

/**
 * Password validation constraints
 */
export const PASSWORD_CONFIG = {
  MIN_LENGTH: 8,
  STRONG_LENGTH: 12,
  REQUIREMENTS: {
    LENGTH: (pass: string) => pass.length >= 8,
    UPPER: (pass: string) => /[A-Z]/.test(pass),
    LOWER: (pass: string) => /[a-z]/.test(pass),
    NUMBER: (pass: string) => /\d/.test(pass),
    SPECIAL: (pass: string) => /[^A-Za-z0-9]/.test(pass),
    EXTENDED: (pass: string) => pass.length >= 12,
  },
} as const;

/**
 * Calculates password strength score from 0 to 5
 */
export const calculatePasswordStrength = (password: string): number => {
  if (!password) {
    return 0;
  }

  let score = 0;

  if (PASSWORD_CONFIG.REQUIREMENTS.LENGTH(password)) {
    score += 1;
  }

  if (PASSWORD_CONFIG.REQUIREMENTS.UPPER(password)) {
    score += 1;
  }

  if (PASSWORD_CONFIG.REQUIREMENTS.LOWER(password)) {
    score += 1;
  }

  if (PASSWORD_CONFIG.REQUIREMENTS.NUMBER(password)) {
    score += 1;
  }

  if (PASSWORD_CONFIG.REQUIREMENTS.SPECIAL(password)) {
    score += 1;
  }

  // EXTENDED is a bonus for 12+ chars
  if (PASSWORD_CONFIG.REQUIREMENTS.EXTENDED(password)) {
    score += 1;
  }

  // Normalize to 0-5 scale (since we have 6 checks now)
  return Math.min(Math.floor(score * (5 / 6)), 5);
};

/**
 * Shared Zod schema for password field with all requirements.
 * Used in both auth (sign-up, update-password) and settings (change-password).
 */
export const basePasswordSchema = z
  .string()
  .min(PASSWORD_CONFIG.MIN_LENGTH, 'auth.passwordRequirements')
  .regex(/[A-Z]/, 'auth.passwordRequirements')
  .regex(/[a-z]/, 'auth.passwordRequirements')
  .regex(/\d/, 'auth.passwordRequirements')
  .regex(/[^A-Za-z0-9]/, 'auth.passwordRequirements');
