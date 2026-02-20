'use client';

import { Github, Globe, Link as LinkIcon, Linkedin, type LucideIcon, Twitter } from 'lucide-react';
import { useTranslations } from 'next-intl';

import type { SocialLink } from '@/features/settings/types';
import { cn } from '@/lib/common/utils';

const SOCIAL_ICONS: Record<string, LucideIcon> = {
  website: Globe,
  github: Github,
  twitter: Twitter,
  linkedin: Linkedin,
  other: LinkIcon,
};

const SOCIAL_COLORS: Record<string, string> = {
  github: 'md:hover:border-[#24292e]/30 md:hover:bg-[#24292e]/5',
  twitter: 'md:hover:border-sky-500/30 md:hover:bg-sky-500/5',
  linkedin: 'md:hover:border-blue-600/30 md:hover:bg-blue-600/5',
  website: 'md:hover:border-primary/30 md:hover:bg-primary/5',
  other: 'md:hover:border-primary/30 md:hover:bg-primary/5',
};

export function getDisplayUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, '');
    const path = parsed.pathname.replace(/\/$/, '');

    return path && path !== '/' ? `${host}${path}` : host;
  } catch {
    return url;
  }
}

interface SocialLinksListProps {
  links: SocialLink[];
}

const SocialLinksList = ({ links }: SocialLinksListProps) => {
  const t = useTranslations('profile.sections');

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium">{t('socialLinks')}</h3>

      <div className="flex flex-wrap gap-2">
        {links.map((link) => {
          const Icon = SOCIAL_ICONS[link.label] ?? LinkIcon;
          const colorClass = SOCIAL_COLORS[link.label] ?? SOCIAL_COLORS.other;

          return (
            <a
              key={link.url}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                'border-border/60 text-muted-foreground md:hover:text-foreground inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors',
                colorClass
              )}
            >
              <Icon className="size-4 shrink-0" />
              <span>{getDisplayUrl(link.url)}</span>
            </a>
          );
        })}
      </div>
    </div>
  );
};

export { SocialLinksList };
