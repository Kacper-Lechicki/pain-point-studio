'use server';

import { getAuthenticatedClient } from '@/lib/supabase/get-authenticated-client';
import { mapSupabaseUser } from '@/lib/supabase/user-mapper';

export const getAuthUser = async () => {
  const { user } = await getAuthenticatedClient();

  return user ? mapSupabaseUser(user) : null;
};
