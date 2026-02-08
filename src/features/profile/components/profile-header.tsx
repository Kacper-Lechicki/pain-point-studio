'use client';

import { CalendarDays } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import type { ProfilePreviewData } from '@/features/profile/types';

interface ProfileHeaderProps {
  profile: ProfilePreviewData;
}

const ProfileHeader = ({ profile }: ProfileHeaderProps) => {
  const t = useTranslations('profile');
  const format = useFormatter();

  const fallbackInitials = profile.fullName
    ? profile.fullName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?';

  const memberSinceFormatted = profile.memberSince
    ? format.dateTime(new Date(profile.memberSince), { year: 'numeric', month: 'long' })
    : '';

  return (
    <div className="flex flex-col items-start gap-4 sm:flex-row">
      <Avatar className="ring-offset-background ring-border/50 size-20 shrink-0 ring-2 ring-offset-2">
        <AvatarImage src={profile.avatarUrl || undefined} alt={profile.fullName || ''} />
        <AvatarFallback className="text-lg">{fallbackInitials}</AvatarFallback>
      </Avatar>

      <div className="space-y-2">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold">
            {profile.fullName || (
              <span className="text-muted-foreground italic">{t('empty.fullName')}</span>
            )}
          </h2>

          {profile.role ? (
            <Badge variant="secondary">{profile.role}</Badge>
          ) : (
            <span className="text-muted-foreground text-sm italic">{t('empty.role')}</span>
          )}
        </div>

        <p className="text-muted-foreground text-sm leading-relaxed">
          {profile.bio || <span className="italic">{t('empty.bio')}</span>}
        </p>

        {memberSinceFormatted && (
          <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
            <CalendarDays className="size-3.5" />
            <span>{t('memberSince', { date: memberSinceFormatted })}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export { ProfileHeader };
