'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/common/utils';

interface ProjectAvatarProps {
  imageUrl: string | null | undefined;
  name: string;
  /** Pixel size — controls both the avatar dimensions and fallback text. */
  size?: 32 | 48;
  className?: string;
}

export function ProjectAvatar({ imageUrl, name, size = 32, className }: ProjectAvatarProps) {
  const letter = name.trim().charAt(0).toUpperCase() || '?';

  return (
    <Avatar
      className={cn(
        'shrink-0 rounded-lg',
        size === 32 && 'size-8',
        size === 48 && 'size-12',
        className
      )}
    >
      {imageUrl && <AvatarImage src={imageUrl} alt={name} className="rounded-lg object-cover" />}
      <AvatarFallback
        className={cn(
          'bg-muted text-muted-foreground rounded-lg font-semibold',
          size === 32 && 'text-xs',
          size === 48 && 'text-base'
        )}
      >
        {letter}
      </AvatarFallback>
    </Avatar>
  );
}
