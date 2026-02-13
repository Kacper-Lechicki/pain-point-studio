'use client';

import Image from 'next/image';

import { CalendarDays } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import type { ProfilePreviewData } from '@/features/profile/types';
import { getInitials } from '@/lib/common/utils';

interface ProfileHeaderProps {
  profile: ProfilePreviewData;
}

const ProfileHeader = ({ profile }: ProfileHeaderProps) => {
  const t = useTranslations('profile');
  const format = useFormatter();

  const fallbackInitials = getInitials(profile.fullName, '?');

  const memberSinceFormatted = profile.memberSince
    ? format.dateTime(new Date(profile.memberSince), { year: 'numeric', month: 'long' })
    : '';

  return (
    <div className="flex flex-col items-start gap-5 sm:flex-row">
      <div className="relative shrink-0">
        <div className="bg-primary/10 absolute -inset-2 rounded-full blur-xl" />
        <Avatar className="ring-offset-background ring-primary/20 relative size-24 ring-4 ring-offset-2">
          {profile.avatarUrl ? (
            <Image
              src={profile.avatarUrl}
              alt={profile.fullName || ''}
              width={96}
              height={96}
              sizes="96px"
              className="aspect-square size-full object-cover"
            />
          ) : (
            <AvatarFallback className="text-xl font-semibold">{fallbackInitials}</AvatarFallback>
          )}
        </Avatar>
      </div>

      <div className="space-y-3">
        <div className="space-y-1.5">
          <h2 className="text-2xl font-bold tracking-tight">
            {profile.fullName || (
              <span className="text-muted-foreground italic">{t('empty.fullName')}</span>
            )}
          </h2>

          {profile.role ? (
            <Badge variant="secondary" className="text-xs">
              {profile.role}
            </Badge>
          ) : (
            <span className="text-muted-foreground text-xs italic">{t('empty.role')}</span>
          )}
        </div>

        <p className="text-muted-foreground max-w-lg text-sm leading-relaxed break-words whitespace-pre-wrap">
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
