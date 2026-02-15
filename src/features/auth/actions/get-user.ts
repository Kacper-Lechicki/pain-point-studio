'use server';

import { createClient } from '@/lib/supabase/server';

/** Returns the authenticated Supabase user, or null if unauthenticated. */
export const getAuthUser = async () => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
};
