'use client';

import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';

export function YesNoEditor() {
  const t = useTranslations();

  return (
    <div className="flex items-center gap-3">
      <Button variant="outline" disabled className="flex-1 opacity-60">
        {t('surveys.builder.yesLabel')}
      </Button>
      <Button variant="outline" disabled className="flex-1 opacity-60">
        {t('surveys.builder.noLabel')}
      </Button>
    </div>
  );
}
