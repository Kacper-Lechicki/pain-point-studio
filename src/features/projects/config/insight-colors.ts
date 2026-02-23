import { Compass, TrendingDown, TrendingUp } from 'lucide-react';

import type { InsightType } from '@/features/projects/types';

/** Background, icon, and text colors for each insight type. */
export const INSIGHT_COLORS = {
  strength: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    icon: 'text-emerald-600 dark:text-emerald-400',
    text: 'text-emerald-900 dark:text-emerald-100',
  },
  threat: {
    bg: 'bg-rose-50 dark:bg-rose-950/30',
    icon: 'text-rose-600 dark:text-rose-400',
    text: 'text-rose-900 dark:text-rose-100',
  },
  decision: {
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    icon: 'text-amber-600 dark:text-amber-400',
    text: 'text-amber-900 dark:text-amber-100',
  },
} satisfies Record<InsightType, { bg: string; icon: string; text: string }>;

/** Lucide icon for each insight type. */
export const INSIGHT_ICONS = {
  strength: TrendingUp,
  threat: TrendingDown,
  decision: Compass,
} satisfies Record<InsightType, typeof TrendingUp>;
