import { formatDistanceToNow } from 'date-fns';
import { Calendar, Clock, MessageSquare } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { ProjectOwner } from '@/features/projects/actions/get-project';

interface ProjectMetadataProps {
  updatedAt: string;
  createdAt: string;
  lastResponseAt?: string | null | undefined;
  owner?: ProjectOwner | null | undefined;
}

export function ProjectMetadata({
  updatedAt,
  createdAt,
  lastResponseAt,
  owner,
}: ProjectMetadataProps) {
  const t = useTranslations();

  return (
    <div className="text-muted-foreground mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
      {owner && (
        <>
          <div className="flex items-center gap-1.5">
            <Avatar size="sm">
              {owner.avatarUrl && <AvatarImage src={owner.avatarUrl} alt={owner.fullName} />}
              <AvatarFallback>
                {owner.fullName
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span>{owner.fullName}</span>
          </div>
          <span className="text-muted-foreground/40">&middot;</span>
        </>
      )}

      <span className="inline-flex items-center gap-1">
        <Clock className="size-3 shrink-0" aria-hidden />
        {t('projects.detail.meta.updated')}{' '}
        {formatDistanceToNow(new Date(updatedAt), {
          addSuffix: true,
        }).replace(/^about /i, '')}
      </span>

      <span className="text-muted-foreground/40">&middot;</span>

      <span className="inline-flex items-center gap-1">
        <MessageSquare className="size-3 shrink-0" aria-hidden />
        {lastResponseAt
          ? `${t('projects.detail.meta.lastResponse')} ${formatDistanceToNow(
              new Date(lastResponseAt),
              {
                addSuffix: true,
              }
            ).replace(/^about /i, '')}`
          : t('projects.detail.meta.noResponses')}
      </span>

      <span className="text-muted-foreground/40">&middot;</span>

      <span className="inline-flex items-center gap-1">
        <Calendar className="size-3 shrink-0" aria-hidden />
        {t('projects.detail.meta.created')}{' '}
        {new Date(createdAt).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })}
      </span>
    </div>
  );
}
