'use client';

import { Lightbulb, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { HeroHighlight } from '@/components/ui/hero-highlight';
import type { MessageKey } from '@/i18n/types';

interface InsightsEmptyStateProps {
  onAddInsight: () => void;
  onGoToResearch?: (() => void) | undefined;
}

export function InsightsEmptyState({ onAddInsight, onGoToResearch }: InsightsEmptyStateProps) {
  const t = useTranslations();

  return (
    <HeroHighlight
      showDotsOnMobile={false}
      containerClassName="w-full rounded-lg border border-dashed border-border"
    >
      <div className="flex w-full flex-col items-center px-4 py-12 text-center md:py-16">
        <Lightbulb className="text-muted-foreground size-8" aria-hidden />
        <p className="text-foreground mt-3 text-base font-medium">
          {t('projects.insights.emptyTitle' as MessageKey)}
        </p>
        <p className="text-muted-foreground mt-1 max-w-sm text-sm">
          {t('projects.insights.emptyDescription' as MessageKey)}
        </p>

        <div className="mt-4 flex items-center gap-2">
          <Button onClick={onAddInsight}>
            <Plus className="size-3.5" aria-hidden />
            {t('projects.insights.emptyCta' as MessageKey)}
          </Button>

          {onGoToResearch && (
            <Button variant="outline" onClick={onGoToResearch}>
              {t('projects.insights.emptyGoToResearch' as MessageKey)}
            </Button>
          )}
        </div>
      </div>
    </HeroHighlight>
  );
}
