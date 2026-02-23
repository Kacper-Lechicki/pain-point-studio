import { ArrowRight, TrendingDown, TrendingUp } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Badge } from '@/components/ui/badge';
import type { Signal, SignalType } from '@/features/projects/types';
import type { MessageKey } from '@/i18n/types';
import { cn } from '@/lib/common/utils';

// ── Style maps ────────────────────────────────────────────────────────

const SIGNAL_ICON = {
  strength: TrendingUp,
  threat: TrendingDown,
  signal: ArrowRight,
} as const;

const SIGNAL_COLOR = {
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
  signal: {
    bg: 'bg-sky-50 dark:bg-sky-950/30',
    icon: 'text-sky-600 dark:text-sky-400',
    text: 'text-sky-900 dark:text-sky-100',
  },
} satisfies Record<SignalType, { bg: string; icon: string; text: string }>;

// ── Message key mapping ───────────────────────────────────────────────

function getMessageKey(signal: Signal): MessageKey {
  switch (signal.source) {
    case 'yes_no':
      return signal.type === 'strength'
        ? ('projects.signals.yesNoStrength' as MessageKey)
        : ('projects.signals.yesNoThreat' as MessageKey);
    case 'rating':
      return signal.type === 'strength'
        ? ('projects.signals.ratingStrength' as MessageKey)
        : ('projects.signals.ratingThreat' as MessageKey);
    case 'multiple_choice':
      return 'projects.signals.mcDominant' as MessageKey;
    case 'completion_rate':
      return 'projects.signals.completionThreat' as MessageKey;
    case 'no_data':
      return 'projects.signals.noData' as MessageKey;
  }
}

function getMessageParams(signal: Signal): Record<string, string | number> {
  const pct = Math.round(signal.value * 100);

  switch (signal.source) {
    case 'yes_no':
      return { pct, question: signal.questionText ?? '' };
    case 'rating':
      return {
        avg: Number(signal.value.toFixed(1)),
        max: signal.detail ?? '5',
        question: signal.questionText ?? '',
      };
    case 'multiple_choice':
      return { pct, option: signal.detail ?? '', question: signal.questionText ?? '' };
    case 'completion_rate':
      return { pct, survey: signal.surveyTitle ?? '' };
    case 'no_data':
      return {};
  }
}

// ── Component ─────────────────────────────────────────────────────────

interface SignalItemProps {
  signal: Signal;
}

export function SignalItem({ signal }: SignalItemProps) {
  const t = useTranslations();

  const Icon = SIGNAL_ICON[signal.type];
  const colors = SIGNAL_COLOR[signal.type];
  const messageKey = getMessageKey(signal);
  const messageParams = getMessageParams(signal);

  return (
    <div className={cn('flex items-start gap-2 rounded-md px-3 py-2', colors.bg)}>
      <Icon className={cn('mt-0.5 size-3.5 shrink-0', colors.icon)} aria-hidden />

      <span className={cn('flex-1 text-xs leading-relaxed', colors.text)}>
        {t(messageKey, messageParams as never)}
      </span>

      <Badge
        variant="outline"
        className="mt-0.5 shrink-0 border-current/20 px-1.5 py-0 text-[10px] font-normal opacity-60"
      >
        {t('projects.signals.auto' as MessageKey)}
      </Badge>
    </div>
  );
}
