import { Compass, Lightbulb, TrendingDown, TrendingUp } from 'lucide-react';

import type { InsightType } from '@/features/projects/types';

/** Background, icon, and text colors for each insight type. */
export const INSIGHT_COLORS = {
  strength: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    icon: 'text-emerald-600 dark:text-emerald-400',
    text: 'text-emerald-900 dark:text-emerald-100',
    dot: 'bg-green-500',
    headerText: 'text-green-600 dark:text-green-400',
    pillBg: 'bg-green-500/[0.12]',
    pillBorder: 'border-green-500',
    pillText: 'text-green-600 dark:text-green-400',
    stripe: 'border-l-green-500',
  },
  opportunity: {
    bg: 'bg-sky-50 dark:bg-sky-950/30',
    icon: 'text-sky-600 dark:text-sky-400',
    text: 'text-sky-900 dark:text-sky-100',
    dot: 'bg-sky-500',
    headerText: 'text-sky-600 dark:text-sky-400',
    pillBg: 'bg-sky-500/[0.12]',
    pillBorder: 'border-sky-500',
    pillText: 'text-sky-600 dark:text-sky-400',
    stripe: 'border-l-sky-500',
  },
  threat: {
    bg: 'bg-rose-50 dark:bg-rose-950/30',
    icon: 'text-rose-600 dark:text-rose-400',
    text: 'text-rose-900 dark:text-rose-100',
    dot: 'bg-rose-500',
    headerText: 'text-rose-600 dark:text-rose-400',
    pillBg: 'bg-rose-500/[0.12]',
    pillBorder: 'border-rose-500',
    pillText: 'text-rose-600 dark:text-rose-400',
    stripe: 'border-l-rose-500',
  },
  decision: {
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    icon: 'text-amber-600 dark:text-amber-400',
    text: 'text-amber-900 dark:text-amber-100',
    dot: 'bg-amber-500',
    headerText: 'text-amber-600 dark:text-amber-400',
    pillBg: 'bg-amber-500/[0.12]',
    pillBorder: 'border-amber-500',
    pillText: 'text-amber-600 dark:text-amber-400',
    stripe: 'border-l-amber-500',
  },
} satisfies Record<
  InsightType,
  {
    bg: string;
    icon: string;
    text: string;
    dot: string;
    headerText: string;
    pillBg: string;
    pillBorder: string;
    pillText: string;
    stripe: string;
  }
>;

/** Lucide icon for each insight type. */
export const INSIGHT_ICONS = {
  strength: TrendingUp,
  opportunity: Lightbulb,
  threat: TrendingDown,
  decision: Compass,
} satisfies Record<InsightType, typeof TrendingUp>;
