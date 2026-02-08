'use client';

import { useTranslations } from 'next-intl';

const SettingsHeader = () => {
  const t = useTranslations('settings');

  return (
    <div className="border-border/50 space-y-1 border-b pb-6">
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t('title')}</h1>
      <p className="text-muted-foreground text-sm">{t('description')}</p>
    </div>
  );
};

export { SettingsHeader };
