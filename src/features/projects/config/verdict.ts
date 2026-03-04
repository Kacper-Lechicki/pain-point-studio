import { AlertTriangle, CircleDashed, Compass, Rocket, ThumbsDown, TrendingUp } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────────

export type VerdictStatus =
  | 'no-data'
  | 'exploring'
  | 'promising'
  | 'needs-attention'
  | 'validated'
  | 'invalidated';

export interface VerdictResult {
  status: VerdictStatus;
  /** 0–1 fraction representing data completeness (totalResponses / targetResponses). */
  confidence: number;
  /** i18n key for the one-liner summary. */
  summaryKey: string;
}

// ── Visual config per status ─────────────────────────────────────────

interface VerdictStatusConfig {
  labelKey: string;
  descriptionKey: string;
  ariaLabelKey: string;
  icon: LucideIcon;
  colors: {
    bg: string;
    border: string;
    text: string;
    icon: string;
    badge: string;
    bar: string;
  };
}

export const VERDICT_STATUS_CONFIG: Record<VerdictStatus, VerdictStatusConfig> = {
  'no-data': {
    labelKey: 'projects.verdict.noData.label',
    descriptionKey: 'projects.verdict.noData.description',
    ariaLabelKey: 'projects.verdict.ariaLabel',
    icon: CircleDashed,
    colors: {
      bg: 'bg-muted/40',
      border: 'border-border border-dashed',
      text: 'text-muted-foreground',
      icon: 'text-muted-foreground',
      badge: 'border-border bg-muted text-muted-foreground',
      bar: 'bg-muted-foreground/30',
    },
  },
  exploring: {
    labelKey: 'projects.verdict.exploring.label',
    descriptionKey: 'projects.verdict.exploring.description',
    ariaLabelKey: 'projects.verdict.ariaLabel',
    icon: Compass,
    colors: {
      bg: 'bg-sky-50 dark:bg-sky-950/30',
      border: 'border-sky-200 dark:border-sky-800',
      text: 'text-sky-900 dark:text-sky-100',
      icon: 'text-sky-600 dark:text-sky-400',
      badge: 'border-sky-500/25 bg-sky-500/15 text-sky-700 dark:text-sky-400',
      bar: 'bg-sky-500',
    },
  },
  promising: {
    labelKey: 'projects.verdict.promising.label',
    descriptionKey: 'projects.verdict.promising.description',
    ariaLabelKey: 'projects.verdict.ariaLabel',
    icon: TrendingUp,
    colors: {
      bg: 'bg-emerald-50 dark:bg-emerald-950/30',
      border: 'border-emerald-200 dark:border-emerald-800',
      text: 'text-emerald-900 dark:text-emerald-100',
      icon: 'text-emerald-600 dark:text-emerald-400',
      badge: 'border-emerald-500/25 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
      bar: 'bg-emerald-500',
    },
  },
  'needs-attention': {
    labelKey: 'projects.verdict.needsAttention.label',
    descriptionKey: 'projects.verdict.needsAttention.description',
    ariaLabelKey: 'projects.verdict.ariaLabel',
    icon: AlertTriangle,
    colors: {
      bg: 'bg-amber-50 dark:bg-amber-950/30',
      border: 'border-amber-200 dark:border-amber-800',
      text: 'text-amber-900 dark:text-amber-100',
      icon: 'text-amber-600 dark:text-amber-400',
      badge: 'border-amber-500/25 bg-amber-500/15 text-amber-700 dark:text-amber-400',
      bar: 'bg-amber-500',
    },
  },
  validated: {
    labelKey: 'projects.verdict.validated.label',
    descriptionKey: 'projects.verdict.validated.description',
    ariaLabelKey: 'projects.verdict.ariaLabel',
    icon: Rocket,
    colors: {
      bg: 'bg-emerald-50 dark:bg-emerald-950/30',
      border: 'border-emerald-300 dark:border-emerald-700',
      text: 'text-emerald-900 dark:text-emerald-100',
      icon: 'text-emerald-600 dark:text-emerald-400',
      badge: 'border-emerald-500/25 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
      bar: 'bg-emerald-500',
    },
  },
  invalidated: {
    labelKey: 'projects.verdict.invalidated.label',
    descriptionKey: 'projects.verdict.invalidated.description',
    ariaLabelKey: 'projects.verdict.ariaLabel',
    icon: ThumbsDown,
    colors: {
      bg: 'bg-red-50 dark:bg-red-950/30',
      border: 'border-red-200 dark:border-red-800',
      text: 'text-red-900 dark:text-red-100',
      icon: 'text-red-600 dark:text-red-400',
      badge: 'border-red-500/25 bg-red-500/15 text-red-700 dark:text-red-400',
      bar: 'bg-red-500',
    },
  },
};
