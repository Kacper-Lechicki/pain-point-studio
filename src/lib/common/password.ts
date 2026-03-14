import { z } from 'zod';

const MIN_LENGTH = 8;
const STRONG_LENGTH = 12;

export const PASSWORD_CONFIG = {
  MIN_LENGTH,
  STRONG_LENGTH,
  REQUIREMENTS: {
    LENGTH: (pass: string) => pass.length >= MIN_LENGTH,
    UPPER: (pass: string) => /[A-Z]/.test(pass),
    LOWER: (pass: string) => /[a-z]/.test(pass),
    NUMBER: (pass: string) => /\d/.test(pass),
    SPECIAL: (pass: string) => /[^A-Za-z0-9]/.test(pass),
    EXTENDED: (pass: string) => pass.length >= STRONG_LENGTH,
  },
} as const;

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

  if (PASSWORD_CONFIG.REQUIREMENTS.EXTENDED(password)) {
    score += 1;
  }

  return Math.min(Math.floor(score * (5 / 6)), 5);
};

export const basePasswordSchema = z
  .string()
  .min(PASSWORD_CONFIG.MIN_LENGTH, 'auth.passwordRequirements')
  .regex(/[A-Z]/, 'auth.passwordRequirements')
  .regex(/[a-z]/, 'auth.passwordRequirements')
  .regex(/\d/, 'auth.passwordRequirements')
  .regex(/[^A-Za-z0-9]/, 'auth.passwordRequirements');
