'use server';

import { cache } from 'react';

import { createClient } from '@/lib/supabase/server';

export interface UserSurvey {
  id: string;
  title: string;
  description: string;
  category: string;
  status: 'draft' | 'active' | 'closed' | 'archived';
  slug: string | null;
  responseCount: number;
  createdAt: string;
  updatedAt: string;
}

export const getUserSurveys = cache(async (): Promise<UserSurvey[] | null> => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data, error } = await supabase.rpc('get_user_surveys_with_counts', {
    p_user_id: user.id,
  });

  if (error || !data) {
    return [];
  }

  const surveys = data as unknown as Array<{
    id: string;
    title: string;
    description: string;
    category: string;
    status: 'draft' | 'active' | 'closed' | 'archived';
    slug: string | null;
    responseCount: number;
    createdAt: string;
    updatedAt: string;
  }>;

  return surveys;
});
