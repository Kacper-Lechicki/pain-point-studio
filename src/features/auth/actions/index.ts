'use server';

import { redirect } from 'next/navigation';

import { Provider } from '@supabase/supabase-js';
import { getLocale } from 'next-intl/server';
import { z } from 'zod';

import { createClient } from '@/lib/supabase/server';

import { forgotPasswordSchema, signInSchema, signUpSchema, updatePasswordSchema } from '../types';

export const signInWithEmail = async (formData: z.infer<typeof signInSchema>) => {
  const supabase = await createClient();
  const validation = signInSchema.safeParse(formData);

  if (!validation.success) {
    return { error: 'Invalid data' };
  }

  const { error } = await supabase.auth.signInWithPassword({
    email: validation.data.email,
    password: validation.data.password,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
};

export const signUpWithEmail = async (formData: z.infer<typeof signUpSchema>) => {
  const supabase = await createClient();
  const locale = await getLocale();
  const validation = signUpSchema.safeParse(formData);

  if (!validation.success) {
    return { error: 'Invalid data' };
  }

  const { error } = await supabase.auth.signUp({
    email: validation.data.email,
    password: validation.data.password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/${locale}/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
};

export const signInWithOAuth = async (provider: Provider) => {
  const supabase = await createClient();
  const locale = await getLocale();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/${locale}/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (data.url) {
    redirect(data.url);
  }

  return { error: 'No redirect URL returned' };
};

export const signOut = async () => {
  const supabase = await createClient();
  await supabase.auth.signOut();

  redirect('/');
};

export const resetPassword = async (formData: z.infer<typeof forgotPasswordSchema>) => {
  const supabase = await createClient();
  const locale = await getLocale();
  const validation = forgotPasswordSchema.safeParse(formData);

  if (!validation.success) {
    return { error: 'Invalid email' };
  }

  const { error } = await supabase.auth.resetPasswordForEmail(validation.data.email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/${locale}/update-password`,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
};

export const updatePassword = async (formData: z.infer<typeof updatePasswordSchema>) => {
  const supabase = await createClient();
  const validation = updatePasswordSchema.safeParse(formData);

  if (!validation.success) {
    return { error: 'Invalid passwords' };
  }

  const { error } = await supabase.auth.updateUser({
    password: validation.data.password,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
};
