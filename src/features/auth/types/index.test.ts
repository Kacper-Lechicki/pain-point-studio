import { describe, expect, it } from 'vitest';

import {
  PASSWORD_MIN_LENGTH,
  forgotPasswordSchema,
  signInSchema,
  signUpSchema,
  updatePasswordSchema,
} from './index';

describe('Auth Schemas', () => {
  describe('PASSWORD_MIN_LENGTH', () => {
    it('should be 8', () => {
      expect(PASSWORD_MIN_LENGTH).toBe(8);
    });
  });

  describe('signInSchema', () => {
    it('should accept valid email and password', () => {
      const result = signInSchema.safeParse({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const result = signInSchema.safeParse({
        email: 'not-an-email',
        password: 'password123',
      });

      expect(result.success).toBe(false);
    });

    it('should reject short password', () => {
      const result = signInSchema.safeParse({
        email: 'test@example.com',
        password: '1234567',
      });

      expect(result.success).toBe(false);
    });

    it('should reject empty email', () => {
      const result = signInSchema.safeParse({
        email: '',
        password: 'password123',
      });

      expect(result.success).toBe(false);
    });

    it('should accept password with exactly min length', () => {
      const result = signInSchema.safeParse({
        email: 'test@example.com',
        password: '12345678',
      });

      expect(result.success).toBe(true);
    });
  });

  describe('signUpSchema', () => {
    it('should accept valid email and password', () => {
      const result = signUpSchema.safeParse({
        email: 'new@example.com',
        password: 'securepass1',
      });

      expect(result.success).toBe(true);
    });

    it('should reject short password', () => {
      const result = signUpSchema.safeParse({
        email: 'new@example.com',
        password: 'short',
      });

      expect(result.success).toBe(false);
    });
  });

  describe('forgotPasswordSchema', () => {
    it('should accept valid email', () => {
      const result = forgotPasswordSchema.safeParse({
        email: 'test@example.com',
      });

      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const result = forgotPasswordSchema.safeParse({
        email: 'not-valid',
      });

      expect(result.success).toBe(false);
    });

    it('should reject empty email', () => {
      const result = forgotPasswordSchema.safeParse({
        email: '',
      });

      expect(result.success).toBe(false);
    });
  });

  describe('updatePasswordSchema', () => {
    it('should accept matching passwords', () => {
      const result = updatePasswordSchema.safeParse({
        password: 'newpassword1',
        confirmPassword: 'newpassword1',
      });

      expect(result.success).toBe(true);
    });

    it('should reject non-matching passwords', () => {
      const result = updatePasswordSchema.safeParse({
        password: 'newpassword1',
        confirmPassword: 'different123',
      });

      expect(result.success).toBe(false);
    });

    it('should reject short password', () => {
      const result = updatePasswordSchema.safeParse({
        password: 'short',
        confirmPassword: 'short',
      });

      expect(result.success).toBe(false);
    });

    it('should reject short confirm password', () => {
      const result = updatePasswordSchema.safeParse({
        password: 'validpass1',
        confirmPassword: '1234567',
      });

      expect(result.success).toBe(false);
    });
  });
});
