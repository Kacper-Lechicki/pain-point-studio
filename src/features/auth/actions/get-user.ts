'use server';

import { createClient } from '@/lib/supabase/server';

/**
 * Server Action to get the current authenticated user.
 * Can be called from Client Components via server action invocation.
 */
export const getAuthUser = async () => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
};
