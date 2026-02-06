'use server';

import { AuthActionResult } from '@/features/auth/types';
import { createClient } from '@/lib/supabase/server';

export const signOut = async (): Promise<AuthActionResult> => {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    return { error: error.message };
  }

  return { success: true };
};
