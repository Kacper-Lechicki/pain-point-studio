'use client';

import { StickyNote } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { HeroHighlight } from '@/components/ui/hero-highlight';

export function ProjectNotesTab() {
  const t = useTranslations('projects.detail.notes');

  return (
    <HeroHighlight
      showDotsOnMobile={false}
      containerClassName="w-full rounded-lg border border-dashed border-border"
    >
      <div className="flex w-full flex-col items-center px-4 py-12 text-center md:py-16">
        <StickyNote className="text-muted-foreground size-8" aria-hidden />
        <p className="text-foreground mt-3 text-base font-medium">{t('placeholder')}</p>
        <p className="text-muted-foreground mt-1 max-w-sm text-sm">{t('comingSoon')}</p>
      </div>
    </HeroHighlight>
  );
}
