'use server';

import { createClient } from '@/lib/supabase/server';
import { mapSupabaseUser } from '@/lib/supabase/user-mapper';

export const getAuthUser = async () => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user ? mapSupabaseUser(user) : null;
};
