'use server';

import { createClient } from '@/lib/supabase/server';

export const getAuthUser = async () => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
};
