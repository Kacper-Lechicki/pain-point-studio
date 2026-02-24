'use client';

import { CheckCircle2, Circle, Clock, HelpCircle, TrendingUp } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';

import type { VerdictStatus } from '@/features/dashboard/lib/project-verdict';
import type { MessageKey } from '@/i18n/types';
import { cn } from '@/lib/common/utils';

interface VerdictConfig {
  labelKey: MessageKey;
  icon: LucideIcon;
  dotClassName: string;
  textClassName: string;
}

const VERDICT_CONFIG: Record<VerdictStatus, VerdictConfig> = {
  not_started: {
    labelKey: 'dashboard.overview.verdict.notStarted' as MessageKey,
    icon: Circle,
    dotClassName: 'bg-muted-foreground/40',
    textClassName: 'text-muted-foreground',
  },
  needs_data: {
    labelKey: 'dashboard.overview.verdict.needsData' as MessageKey,
    icon: HelpCircle,
    dotClassName: 'bg-amber-500',
    textClassName: 'text-amber-700 dark:text-amber-400',
  },
  in_progress: {
    labelKey: 'dashboard.overview.verdict.inProgress' as MessageKey,
    icon: Clock,
    dotClassName: 'bg-blue-500',
    textClassName: 'text-blue-700 dark:text-blue-400',
  },
  ready: {
    labelKey: 'dashboard.overview.verdict.ready' as MessageKey,
    icon: TrendingUp,
    dotClassName: 'bg-emerald-500',
    textClassName: 'text-emerald-700 dark:text-emerald-400',
  },
  validated: {
    labelKey: 'dashboard.overview.verdict.validated' as MessageKey,
    icon: CheckCircle2,
    dotClassName: 'bg-emerald-500',
    textClassName: 'text-emerald-700 dark:text-emerald-400',
  },
};

interface VerdictBadgeProps {
  status: VerdictStatus;
}

export function VerdictBadge({ status }: VerdictBadgeProps) {
  const t = useTranslations();
  const config = VERDICT_CONFIG[status];

  return (
    <span
      className={cn('inline-flex items-center gap-1.5 text-xs font-medium', config.textClassName)}
    >
      <span className={cn('size-1.5 shrink-0 rounded-full', config.dotClassName)} aria-hidden />
      {t(config.labelKey)}
    </span>
  );
}
