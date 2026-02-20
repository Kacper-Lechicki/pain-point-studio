'use client';

import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';

export function YesNoEditor() {
  const t = useTranslations('surveys.builder');

  return (
    <div className="flex items-center gap-3">
      <Button variant="outline" disabled className="flex-1 opacity-60">
        {t('yesLabel')}
      </Button>
      <Button variant="outline" disabled className="flex-1 opacity-60">
        {t('noLabel')}
      </Button>
    </div>
  );
}
