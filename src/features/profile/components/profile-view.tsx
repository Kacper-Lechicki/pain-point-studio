'use client';

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
          <h1 className="text-xl font-bold tracking-tight">{t('preview.title')}</h1>
          <p className="text-muted-foreground text-sm">{t('preview.description')}</p>
        </div>
      )}

      <div className="sm:border-border/50 sm:bg-card/80 rounded-xl sm:border sm:p-6 sm:shadow-xl sm:backdrop-blur-sm lg:p-10">
        <div className="space-y-8">
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
          />

          <Separator />

          <EmptySection
            title={t('sections.statistics.title')}
            description={t('sections.statistics.emptyDescription')}
          />
        </div>
      </div>
    </div>
  );
};

export { ProfileView };
