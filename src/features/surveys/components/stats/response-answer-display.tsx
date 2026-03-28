'use client';

import { Check, X } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Badge } from '@/components/ui/badge';
import { QUESTION_TYPE_ICONS, QUESTION_TYPE_LABEL_KEYS } from '@/features/surveys/config';
import { getSentimentColor, getSentimentKey } from '@/features/surveys/lib/rating-helpers';
import type { ResponseAnswer } from '@/features/surveys/types/response-list';
import { cn } from '@/lib/common/utils';

interface ResponseAnswerDisplayProps {
  answer: ResponseAnswer;
  index: number;
  compact?: boolean | undefined;
}

export function ResponseAnswerDisplay({ answer, index, compact }: ResponseAnswerDisplayProps) {
  const t = useTranslations();

  const TypeIcon = QUESTION_TYPE_ICONS[answer.questionType];
  const typeLabelKey = QUESTION_TYPE_LABEL_KEYS[answer.questionType];
  const typeLabel = t(typeLabelKey as Parameters<typeof t>[0]);

  return (
    <div
      className={cn(
        'border-border/70 bg-card rounded-lg border shadow-sm',
        compact ? 'px-3 py-2.5' : 'px-4 py-3 sm:px-5 sm:py-4'
      )}
    >
      <p className="text-foreground text-sm leading-snug font-semibold sm:text-base">
        <span className="text-muted-foreground tabular-nums">{index + 1}. </span>
        {answer.questionText}
      </p>

      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
        <Badge variant="secondary" className="gap-1 px-1.5 py-0 text-[10px] font-normal">
          <TypeIcon className="size-3" aria-hidden />
          {typeLabel}
        </Badge>
      </div>

      <div className="mt-3">
        <AnswerValue answer={answer} />
      </div>
    </div>
  );
}

function AnswerValue({ answer }: { answer: ResponseAnswer }) {
  const t = useTranslations('surveys.stats');
  const value = answer.value;

  if (!value || Object.keys(value).length === 0) {
    return (
      <span className="text-muted-foreground text-xs italic">{t('responseList.skipped')}</span>
    );
  }

  switch (answer.questionType) {
    case 'open_text':
    case 'short_text':
      return (
        <div className="border-border/50 bg-muted rounded-md border px-3 py-2">
          <p className="text-muted-foreground text-sm whitespace-pre-wrap">
            {(value as { text?: string }).text ?? '—'}
          </p>
        </div>
      );

    case 'yes_no': {
      const isYes = (value as { answer?: boolean }).answer === true;

      return (
        <div className="flex items-center gap-2">
          <div
            className={cn(
              'flex size-5 items-center justify-center rounded-full',
              isYes ? 'bg-emerald-500/15' : 'bg-rose-500/15'
            )}
          >
            {isYes ? (
              <Check className="size-3 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <X className="size-3 text-rose-600 dark:text-rose-400" />
            )}
          </div>

          <span
            className={cn(
              'text-sm font-medium',
              isYes ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
            )}
          >
            {isYes ? t('yesLabel') : t('noLabel')}
          </span>
        </div>
      );
    }

    case 'rating_scale': {
      const rating = (value as { rating?: number }).rating;
      const scaleMax = (answer.questionConfig.max as number | undefined) ?? 5;

      if (rating == null) {
        return <span className="text-muted-foreground text-xs">—</span>;
      }

      const ratio = scaleMax > 0 ? rating / scaleMax : 0;
      const sentimentKey = getSentimentKey(ratio);
      const sentimentColor = getSentimentColor(ratio);

      return (
        <div className="flex items-baseline gap-1.5">
          <span className="text-foreground text-lg font-bold tabular-nums">{rating}</span>
          <span className="text-muted-foreground text-sm">/ {scaleMax}</span>

          <span className={cn('ml-1 text-xs font-medium', sentimentColor)}>
            {t(`sentiment.${sentimentKey}` as Parameters<typeof t>[0])}
          </span>
        </div>
      );
    }

    case 'multiple_choice': {
      const selected = (value as { selected?: string[] }).selected ?? [];

      if (selected.length === 0) {
        return (
          <span className="text-muted-foreground text-xs italic">{t('responseList.skipped')}</span>
        );
      }

      return (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((option) => (
            <Badge key={option} variant="secondary">
              {option}
            </Badge>
          ))}
        </div>
      );
    }

    default:
      return (
        <div className="border-border/50 bg-muted rounded-md border px-3 py-2">
          <p className="text-muted-foreground text-sm">{JSON.stringify(value)}</p>
        </div>
      );
  }
}
