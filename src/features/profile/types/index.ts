import type { SocialLink } from '@/features/settings/types';

export interface ProfilePreviewData {
  fullName: string;
  role: string;
  bio: string;
  avatarUrl: string;
  socialLinks: SocialLink[];
  memberSince: string;
}
