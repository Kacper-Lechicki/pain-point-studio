'use server';

import { cache } from 'react';

import { getTranslations } from 'next-intl/server';

import { ROLES } from '@/features/settings/config/roles';
import { SOCIAL_LINK_TYPES } from '@/features/settings/config/social-link-types';
import type { SocialLink } from '@/features/settings/types';
import { sortOptionsAlphabetically } from '@/lib/common/sort-options';
import { createClient } from '@/lib/supabase/server';
import { mapSupabaseUser } from '@/lib/supabase/user-mapper';

export interface LookupValue {
  value: string;
  label: string;
}

/** Aggregated profile data for the settings page (auth, profile row, identities, lookups). */
export interface ProfileData {
  id: string;
  email: string;
  fullName: string;
  role: string;
  bio: string;
  avatarUrl: string;
  hasPassword: boolean;
  pendingEmail: string | null;
  emailChangeConfirmStatus: number;
  identities: { provider: string; email: string | undefined; identityId: string }[];
  socialLinks: SocialLink[];
  pinnedProjectId: string | null;
  memberSince: string;
  roleOptions: LookupValue[];
  socialLinkOptions: LookupValue[];
}

/**
 * Fetch the authenticated user's full profile data for the settings page.
 * Returns null when unauthenticated. Wrapped with React `cache()` for per-request deduplication.
 */
export const getProfile = cache(async (): Promise<ProfileData | null> => {
  const supabase = await createClient();

  const {
    data: { user: rawUser },
  } = await supabase.auth.getUser();

  if (!rawUser || !rawUser.email) {
    return null;
  }

  const user = mapSupabaseUser(rawUser);

  const [{ data: profile }, { data: hasPasswordResult }, { data: emailChangeStatus }] =
    await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.rpc('has_password'),
      supabase.rpc('get_email_change_status'),
    ]);

  const hasPassword = hasPasswordResult === true;
  const pendingRow = Array.isArray(emailChangeStatus) ? emailChangeStatus[0] : null;
  const t = await getTranslations();

  return {
    id: user.id,
    email: user.email,
    fullName: profile?.full_name ?? '',
    role: profile?.role ?? '',
    bio: profile?.bio ?? '',
    avatarUrl: profile?.avatar_url || (user.userMetadata?.avatar_url as string) || '',
    hasPassword,
    pendingEmail: pendingRow?.new_email ?? null,
    emailChangeConfirmStatus: pendingRow?.confirm_status ?? 0,
    socialLinks: (Array.isArray(profile?.social_links)
      ? profile.social_links
      : []) as unknown as SocialLink[],
    pinnedProjectId: profile?.pinned_project_id ?? null,
    memberSince: user.createdAt,
    identities: user.identities.map((identity) => ({
      provider: identity.provider,
      email: identity.email,
      identityId: identity.identityId,
    })),
    roleOptions: sortOptionsAlphabetically(
      ROLES.map((r) => ({
        value: r.value,
        label: t(r.labelKey as Parameters<typeof t>[0]),
      }))
    ),
    socialLinkOptions: sortOptionsAlphabetically(
      SOCIAL_LINK_TYPES.map((s) => ({
        value: s.value,
        label: t(s.labelKey as Parameters<typeof t>[0]),
      }))
    ),
  };
});
