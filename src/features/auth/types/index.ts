import { z } from 'zod';

export const signInSchema = z.object({
  email: z.email(),
  password: z.string().min(6),
});

export const signUpSchema = z.object({
  email: z.email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const forgotPasswordSchema = z.object({
  email: z.email(),
});

export const updatePasswordSchema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(8, 'Password must be at least 8 characters'),
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
