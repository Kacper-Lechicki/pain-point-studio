'use server';

import { mapAuthError } from '@/features/auth/config';
import { ActionResult } from '@/lib/common/types';
import { createClient } from '@/lib/supabase/server';

export const signOut = async (): Promise<ActionResult> => {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    return { error: mapAuthError(error.message) };
  }

  return { success: true };
};
