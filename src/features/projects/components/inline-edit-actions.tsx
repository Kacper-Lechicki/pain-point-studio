'use client';

import { Check, X } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';

interface InlineEditActionsProps {
  charCount: number;
  maxLength: number;
  saveStatus: 'idle' | 'saving' | 'saved' | 'failed';
  onCancel: () => void;
  onSave: () => void;
}

export function InlineEditActions({
  charCount,
  maxLength,
  saveStatus,
  onCancel,
  onSave,
}: InlineEditActionsProps) {
  const t = useTranslations();

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-muted-foreground text-xs tabular-nums">
        {charCount}/{maxLength}
      </span>
      {saveStatus === 'saving' && (
        <span className="text-muted-foreground text-xs">{t('projects.detail.about.saving')}</span>
      )}
      {saveStatus === 'failed' && (
        <span className="text-destructive text-xs">{t('projects.detail.about.failed')}</span>
      )}
      <Button variant="ghost" size="icon-xs" onClick={onCancel} aria-label={t('common.cancel')}>
        <X className="size-3.5" />
      </Button>
      <Button size="icon-xs" onClick={onSave} disabled={saveStatus === 'saving'}>
        <Check className="size-3.5" />
      </Button>
    </div>
  );
}
