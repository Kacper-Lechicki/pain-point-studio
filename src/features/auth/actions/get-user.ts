'use server';

import { createServerAuth } from '@/lib/providers/server';

export const getAuthUser = async () => {
  const auth = await createServerAuth();

  const { data } = await auth.getUser();

  return data?.user ?? null;
};
