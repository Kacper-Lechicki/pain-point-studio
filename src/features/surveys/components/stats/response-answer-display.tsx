'use client';

import { Star, ThumbsDown, ThumbsUp } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Badge } from '@/components/ui/badge';
import type { ResponseAnswer } from '@/features/surveys/types/response-list';
import { cn } from '@/lib/common/utils';

interface ResponseAnswerDisplayProps {
  answer: ResponseAnswer;
}

export function ResponseAnswerDisplay({ answer }: ResponseAnswerDisplayProps) {
  const t = useTranslations('surveys.stats.responseList');

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium">{answer.questionText}</p>
      <AnswerValue answer={answer} t={t} />
    </div>
  );
}

function AnswerValue({
  answer,
  t,
}: {
  answer: ResponseAnswer;
  t: ReturnType<typeof useTranslations>;
}) {
  const value = answer.value;

  if (!value || Object.keys(value).length === 0) {
    return <span className="text-muted-foreground text-xs italic">{t('skipped')}</span>;
  }

  switch (answer.questionType) {
    case 'open_text':
    case 'short_text': {
      return (
        <div className="border-border/50 bg-muted rounded-md border px-3 py-2">
          <p className="text-muted-foreground text-sm whitespace-pre-wrap">
            {(value as { text?: string }).text ?? '—'}
          </p>
        </div>
      );
    }

    case 'yes_no': {
      const isYes = (value as { answer?: boolean }).answer === true;

      return (
        <Badge
          variant="ghost"
          className={cn(
            'gap-1.5',
            isYes
              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
              : 'bg-rose-500/10 text-rose-700 dark:text-rose-400'
          )}
        >
          {isYes ? <ThumbsUp className="size-3" /> : <ThumbsDown className="size-3" />}
          {isYes ? t('yes') : t('no')}
        </Badge>
      );
    }

    case 'rating_scale': {
      const rating = (value as { rating?: number }).rating;
      const maxRating = (answer.questionConfig as { maxRating?: number }).maxRating ?? 5;

      if (rating == null) {
        return <span className="text-muted-foreground text-xs">—</span>;
      }

      return (
        <div className="flex items-center gap-1">
          {Array.from({ length: maxRating }).map((_, i) => (
            <Star
              key={i}
              className={cn(
                'size-4',
                i < rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'
              )}
            />
          ))}
          <span className="text-muted-foreground ml-1 text-xs tabular-nums">
            {rating}/{maxRating}
          </span>
        </div>
      );
    }

    case 'multiple_choice': {
      const selected = (value as { selected?: string[] }).selected ?? [];

      if (selected.length === 0) {
        return <span className="text-muted-foreground text-xs italic">{t('skipped')}</span>;
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

    default: {
      return (
        <div className="border-border/50 bg-muted rounded-md border px-3 py-2">
          <p className="text-muted-foreground text-sm">{JSON.stringify(value)}</p>
        </div>
      );
    }
  }
}
