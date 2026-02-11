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

  const { data: surveys } = await supabase
    .from('surveys')
    .select('id, title, description, category, status, slug, created_at, updated_at')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });

  if (!surveys || surveys.length === 0) {
    return [];
  }

  const result: UserSurvey[] = await Promise.all(
    surveys.map(async (s) => {
      const { data: count } = await supabase.rpc('get_survey_response_count', {
        p_survey_id: s.id,
      });

      return {
        id: s.id,
        title: s.title,
        description: s.description,
        category: s.category,
        status: s.status,
        slug: s.slug,
        responseCount: count ?? 0,
        createdAt: s.created_at,
        updatedAt: s.updated_at,
      };
    })
  );

  return result;
});
