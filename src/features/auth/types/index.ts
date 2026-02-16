import { z } from 'zod';

import { basePasswordSchema } from '@/features/auth/config/password';

// ── Auth form validation schemas ────────────────────────────────────

/** Sign-in: any non-empty password (strength not enforced on login). */
export const signInSchema = z.object({
  email: z.email(),
  password: z.string().min(1, 'auth.errors.passwordRequired'),
});

/** Sign-up: full password strength requirements enforced. */
export const signUpSchema = z.object({
  email: z.email(),
  password: basePasswordSchema,
});

/** Forgot-password: email only. */
export const forgotPasswordSchema = z.object({
  email: z.email(),
});

/** Update-password: both fields must pass strength rules and match. */
export const updatePasswordSchema = z
  .object({
    password: basePasswordSchema,
    confirmPassword: basePasswordSchema,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'settings.errors.passwordsMismatch',
    path: ['confirmPassword'],
  });

export type SignInSchema = z.infer<typeof signInSchema>;
export type SignUpSchema = z.infer<typeof signUpSchema>;
export type ForgotPasswordSchema = z.infer<typeof forgotPasswordSchema>;
export type UpdatePasswordSchema = z.infer<typeof updatePasswordSchema>;

export type AuthProvider = 'google' | 'github';
