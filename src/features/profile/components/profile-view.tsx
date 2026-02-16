'use client';

import { BarChart3, FolderOpen } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Separator } from '@/components/ui/separator';
import type { ProfileStatistics } from '@/features/profile/actions/get-profile-statistics';
import { EmptySection } from '@/features/profile/components/empty-section';
import { ProfileHeader } from '@/features/profile/components/profile-header';
import { ProfileStatisticsSection } from '@/features/profile/components/profile-statistics';
import { SocialLinksList } from '@/features/profile/components/social-links-list';
import type { ProfilePreviewData } from '@/features/profile/types';

interface ProfileViewProps {
  profile: ProfilePreviewData;
  statistics?: ProfileStatistics | null;
  isPreview?: boolean;
}

const ProfileView = ({ profile, statistics, isPreview = false }: ProfileViewProps) => {
  const t = useTranslations();

  return (
    <div className="space-y-8">
      {isPreview && (
        <div className="space-y-1">
          <h1 className="text-xl font-bold tracking-tight">{t('profile.preview.title')}</h1>
          <p className="text-muted-foreground text-xs">{t('profile.preview.description')}</p>
        </div>
      )}

      <div>
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
            title={t('profile.sections.projects.title')}
            description={t('profile.sections.projects.emptyDescription')}
            icon={FolderOpen}
          />

          <Separator />

          {statistics && statistics.totalSurveys > 0 ? (
            <ProfileStatisticsSection statistics={statistics} />
          ) : (
            <EmptySection
              title={t('profile.sections.statistics.title')}
              description={t('profile.sections.statistics.emptyDescription')}
              icon={BarChart3}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export { ProfileView };
