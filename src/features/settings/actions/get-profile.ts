'use server';

import { getTranslations } from 'next-intl/server';

import { SocialLink } from '@/features/settings/types';
import { createClient } from '@/lib/supabase/server';

export interface LookupValue {
  value: string;
  label: string;
}

export interface ProfileData {
  id: string;
  email: string;
  fullName: string;
  role: string;
  bio: string;
  avatarUrl: string;
  hasPassword: boolean;
  identities: { provider: string; email: string | undefined }[];
  socialLinks: SocialLink[];
  memberSince: string;
  roleOptions: LookupValue[];
  socialLinkOptions: LookupValue[];
}

export const getProfile = async (): Promise<ProfileData | null> => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const [{ data: profile }, { data: roles }, { data: socialLinkTypes }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('roles').select('value, label_key').eq('is_active', true).order('sort_order'),
    supabase
      .from('social_link_types')
      .select('value, label_key')
      .eq('is_active', true)
      .order('sort_order'),
  ]);

  const hasPassword = (user.identities ?? []).some((identity) => identity.provider === 'email');
  const t = await getTranslations();

  return {
    id: user.id,
    email: user.email ?? '',
    fullName: profile?.full_name ?? '',
    role: profile?.role ?? '',
    bio: profile?.bio ?? '',
    avatarUrl: profile?.avatar_url ?? (user.user_metadata?.avatar_url as string) ?? '',
    hasPassword,
    socialLinks: (Array.isArray(profile?.social_links) ? profile.social_links : []) as SocialLink[],
    memberSince: user.created_at ?? '',
    identities: (user.identities ?? []).map((identity) => ({
      provider: identity.provider,
      email: identity.identity_data?.email as string | undefined,
    })),
    roleOptions: (roles ?? []).map((r) => ({
      value: r.value,
      label: t(r.label_key as Parameters<typeof t>[0]),
    })),
    socialLinkOptions: (socialLinkTypes ?? []).map((s) => ({
      value: s.value,
      label: t(s.label_key as Parameters<typeof t>[0]),
    })),
  };
};
