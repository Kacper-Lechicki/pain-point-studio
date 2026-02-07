'use client';

import { useTranslations } from 'next-intl';

const SettingsHeader = () => {
  const t = useTranslations('settings');

  return (
    <div className="space-y-1">
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t('title')}</h1>
      <p className="text-muted-foreground text-sm">{t('description')}</p>
    </div>
  );
};

export { SettingsHeader };
