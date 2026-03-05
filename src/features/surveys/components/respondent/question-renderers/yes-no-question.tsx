'use client';

import { ThumbsDown, ThumbsUp } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { cn } from '@/lib/common/utils';

interface YesNoQuestionProps {
  value: boolean | null;
  onChange: (value: { answer: boolean }) => void;
}

export const YesNoQuestion = ({ value, onChange }: YesNoQuestionProps) => {
  const t = useTranslations('respondent.questions');

  return (
    <div role="radiogroup" aria-label={t('yesNoGroup')} className="flex gap-3">
      <button
        type="button"
        role="radio"
        aria-checked={value === true}
        onClick={() => onChange({ answer: true })}
        className={cn(
          'flex min-h-12 flex-1 items-center justify-center gap-2 rounded-lg border text-sm font-medium transition-colors',
          value === true
            ? 'border-success bg-success/10 text-success'
            : 'border-border text-foreground md:hover:bg-muted/50'
        )}
      >
        <ThumbsUp className="size-4" />
        {t('yesLabel')}
      </button>

      <button
        type="button"
        role="radio"
        aria-checked={value === false}
        onClick={() => onChange({ answer: false })}
        className={cn(
          'flex min-h-12 flex-1 items-center justify-center gap-2 rounded-lg border text-sm font-medium transition-colors',
          value === false
            ? 'border-destructive bg-destructive/10 text-destructive'
            : 'border-border text-foreground md:hover:bg-muted/50'
        )}
      >
        <ThumbsDown className="size-4" />
        {t('noLabel')}
      </button>
    </div>
  );
};
