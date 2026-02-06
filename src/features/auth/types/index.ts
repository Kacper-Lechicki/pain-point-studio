import { z } from 'zod';

import { PASSWORD_CONFIG } from '@/features/auth/config/password';

export const PASSWORD_MIN_LENGTH = PASSWORD_CONFIG.MIN_LENGTH;

const basePasswordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, 'auth.passwordRequirements')
  .regex(/[A-Z]/, 'auth.passwordRequirements')
  .regex(/[a-z]/, 'auth.passwordRequirements')
  .regex(/\d/, 'auth.passwordRequirements')
  .regex(/[^A-Za-z0-9]/, 'auth.passwordRequirements');

export const signInSchema = z.object({
  email: z.email(),
  password: z.string().min(1, 'Password is required'),
});

export const signUpSchema = z.object({
  email: z.email(),
  password: basePasswordSchema,
});

export const forgotPasswordSchema = z.object({
  email: z.email(),
});

export const updatePasswordSchema = z
  .object({
    password: basePasswordSchema,
    confirmPassword: basePasswordSchema,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export type SignInSchema = z.infer<typeof signInSchema>;
export type SignUpSchema = z.infer<typeof signUpSchema>;
export type ForgotPasswordSchema = z.infer<typeof forgotPasswordSchema>;
export type UpdatePasswordSchema = z.infer<typeof updatePasswordSchema>;

export type AuthProvider = 'google' | 'github';

export type AuthActionResult =
  | { success: true; error?: undefined }
  | { error: string; success?: undefined };
