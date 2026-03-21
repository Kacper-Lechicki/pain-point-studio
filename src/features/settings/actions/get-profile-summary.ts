'use server';

import { cache } from 'react';

import { getAuthenticatedClient } from '@/lib/supabase/get-authenticated-client';

export interface ProfileSummaryData {
  id: string;
  fullName: string;
  role: string;
  avatarUrl: string;
  pinnedProjectId: string | null;
}

export const getProfileSummary = cache(async (): Promise<ProfileSummaryData | null> => {
  const { user, supabase } = await getAuthenticatedClient();

  if (!user || !user.email) {
    return null;
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role, avatar_url, pinned_project_id')
    .eq('id', user.id)
    .single();

  return {
    id: user.id,
    fullName: profile?.full_name ?? '',
    role: profile?.role ?? '',
    avatarUrl: profile?.avatar_url || (user.user_metadata?.avatar_url as string) || '',
    pinnedProjectId: profile?.pinned_project_id ?? null,
  };
});
