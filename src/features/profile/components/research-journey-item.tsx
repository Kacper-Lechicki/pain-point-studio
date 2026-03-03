'use client';

import {
  Check,
  FolderPlus,
  type LucideIcon,
  MessageSquare,
  Send,
  Trophy,
  UserPlus,
} from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';

import type { Milestone, MilestoneKey } from '@/features/profile/types';
import { cn } from '@/lib/common/utils';

const MILESTONE_ICONS: Record<MilestoneKey, LucideIcon> = {
  joined: UserPlus,
  first_project: FolderPlus,
  first_survey: Send,
  first_response: MessageSquare,
  responses_10: Trophy,
  responses_50: Trophy,
  responses_100: Trophy,
  responses_500: Trophy,
  responses_1000: Trophy,
};

interface ResearchJourneyItemProps {
  milestone: Milestone;
  isFirst: boolean;
  isLast: boolean;
  nextAchieved: boolean;
}

export const ResearchJourneyItem = ({
  milestone,
  isFirst,
  isLast,
  nextAchieved,
}: ResearchJourneyItemProps) => {
  const t = useTranslations('profile.journey');
  const format = useFormatter();

  const achieved = milestone.achievedAt !== null;
  const Icon = MILESTONE_ICONS[milestone.key];

  let formattedDate: string | null = null;

  if (achieved && milestone.achievedAt !== 'achieved') {
    formattedDate = format.dateTime(new Date(milestone.achievedAt!), {
      month: 'short',
      year: 'numeric',
    });
  }

  return (
    <div
      className="flex flex-col items-center gap-3 overflow-visible"
      title={t(`milestones.${milestone.key}`)}
    >
      {/* Track row: left-line + circle + right-line */}
      <div className="flex w-full items-center">
        {/* Left connector */}
        <div
          className={cn(
            'flex-1',
            isFirst
              ? 'bg-transparent'
              : achieved
                ? 'bg-primary h-0.5'
                : 'bg-muted-foreground/20 h-0.5'
          )}
        />

        {/* Milestone circle */}
        <div className="relative shrink-0">
          {/* Animated glow for next goal */}
          {milestone.isNextGoal && (
            <div className="absolute -inset-2 animate-pulse rounded-full bg-amber-500/10" />
          )}

          {/* Main circle */}
          <div
            className={cn(
              'relative z-10 flex size-10 items-center justify-center rounded-full',
              achieved && !milestone.isNextGoal && 'bg-primary/10 ring-primary/20 ring-1',
              milestone.isNextGoal && 'bg-amber-500/10 ring-2 ring-amber-500/30',
              !achieved && !milestone.isNextGoal && 'bg-muted ring-border ring-1'
            )}
          >
            <Icon
              className={cn(
                'size-[18px]',
                achieved && !milestone.isNextGoal && 'text-primary',
                milestone.isNextGoal && 'text-amber-500',
                !achieved && !milestone.isNextGoal && 'text-muted-foreground'
              )}
            />

            {/* Check badge for achieved milestones */}
            {achieved && !milestone.isNextGoal && (
              <div className="bg-primary ring-background absolute -right-0.5 -bottom-0.5 z-20 flex size-4 items-center justify-center rounded-full ring-[1.5px]">
                <Check className="text-primary-foreground size-2.5" strokeWidth={3} />
              </div>
            )}
          </div>
        </div>

        {/* Right connector */}
        <div
          className={cn(
            'flex-1',
            isLast
              ? 'bg-transparent'
              : nextAchieved
                ? 'bg-primary h-0.5'
                : 'bg-muted-foreground/20 h-0.5'
          )}
        />
      </div>

      {/* Label + date below */}
      <div className="flex flex-col items-center gap-0.5">
        <span
          className={cn(
            'text-center text-[11px] leading-tight font-medium',
            achieved && !milestone.isNextGoal && 'text-foreground',
            milestone.isNextGoal && 'text-amber-500',
            !achieved && !milestone.isNextGoal && 'text-muted-foreground'
          )}
        >
          {t(`short.${milestone.key}`)}
        </span>

        {formattedDate && (
          <span className="text-muted-foreground/60 text-[10px]">{formattedDate}</span>
        )}

        {milestone.isNextGoal && (
          <span className="text-[10px] font-semibold tracking-wide text-amber-500/70 uppercase">
            {t('nextGoal')}
          </span>
        )}
      </div>
    </div>
  );
};
