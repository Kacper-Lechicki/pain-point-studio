'use server';

import { mapAuthError } from '@/features/auth/config';
import { AuthActionResult } from '@/features/auth/types';
import { createClient } from '@/lib/supabase/server';

export const signOut = async (): Promise<AuthActionResult> => {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    return { error: mapAuthError(error.message) };
  }

  return { success: true };
};
