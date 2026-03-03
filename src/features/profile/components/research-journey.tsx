'use client';

import { useTranslations } from 'next-intl';

import { ResearchJourneyItem } from '@/features/profile/components/research-journey-item';
import type { Milestone } from '@/features/profile/types';

interface ResearchJourneyProps {
  milestones: Milestone[];
}

export const ResearchJourney = ({ milestones }: ResearchJourneyProps) => {
  const t = useTranslations('profile.journey');

  if (milestones.length === 0) {
    return null;
  }

  const achievedCount = milestones.filter((m) => m.achievedAt !== null).length;
  const progress = Math.round((achievedCount / milestones.length) * 100);

  return (
    <div className="space-y-5">
      {/* Header with progress */}
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-sm font-medium">{t('title')}</h3>
        <div className="flex items-center gap-2.5">
          <div className="bg-muted-foreground/20 h-1.5 w-16 overflow-hidden rounded-full">
            <div
              className="bg-primary h-full rounded-full transition-all duration-700 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-muted-foreground text-[11px] font-medium tabular-nums">
            {achievedCount}/{milestones.length}
          </span>
        </div>
      </div>

      {/* Milestone timeline – wraps to next row when needed */}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(88px,1fr))] gap-y-6">
        {milestones.map((milestone, index) => (
          <ResearchJourneyItem
            key={milestone.key}
            milestone={milestone}
            isFirst={index === 0}
            isLast={index === milestones.length - 1}
            nextAchieved={
              index < milestones.length - 1 && (milestones[index + 1]?.achievedAt ?? null) !== null
            }
          />
        ))}
      </div>
    </div>
  );
};
