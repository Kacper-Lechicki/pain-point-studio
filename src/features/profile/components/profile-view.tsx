'use client';

import { BarChart3, CircleUserRound, FolderOpen } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Separator } from '@/components/ui/separator';
import { EmptySection } from '@/features/profile/components/empty-section';
import { ProfileHeader } from '@/features/profile/components/profile-header';
import { SocialLinksList } from '@/features/profile/components/social-links-list';
import type { ProfilePreviewData } from '@/features/profile/types';

interface ProfileViewProps {
  profile: ProfilePreviewData;
  isPreview?: boolean;
}

const ProfileView = ({ profile, isPreview = false }: ProfileViewProps) => {
  const t = useTranslations('profile');

  return (
    <div className="space-y-8">
      {isPreview && (
        <div className="space-y-1">
          <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight">
            <CircleUserRound className="text-muted-foreground size-5 shrink-0" aria-hidden />
            {t('preview.title')}
          </h1>
          <p className="text-muted-foreground text-xs">{t('preview.description')}</p>
        </div>
      )}

      <ProfileHeader profile={profile} />

      {profile.socialLinks.length > 0 && (
        <>
          <Separator />
          <SocialLinksList links={profile.socialLinks} />
        </>
      )}

      <Separator />

      <EmptySection
        title={t('sections.projects.title')}
        description={t('sections.projects.emptyDescription')}
        icon={FolderOpen}
      />

      <Separator />

      <EmptySection
        title={t('sections.statistics.title')}
        description={t('sections.statistics.emptyDescription')}
        icon={BarChart3}
      />
    </div>
  );
};

export { ProfileView };
