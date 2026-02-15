'use server';

import { ActionResult } from '@/lib/common/types';
import { mapSupabaseError } from '@/lib/supabase/errors';
import { createClient } from '@/lib/supabase/server';

/** Signs the user out and invalidates the server-side session. */
export const signOut = async (): Promise<ActionResult> => {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    return { error: mapSupabaseError(error.message) };
  }

  return { success: true };
};
