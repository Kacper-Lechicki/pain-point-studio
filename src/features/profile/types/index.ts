import type { SocialLink } from '@/features/settings/types';

/** Data required to render the public profile preview page. */
export interface ProfilePreviewData {
  fullName: string;
  role: string;
  bio: string;
  avatarUrl: string;
  socialLinks: SocialLink[];
  memberSince: string;
}
