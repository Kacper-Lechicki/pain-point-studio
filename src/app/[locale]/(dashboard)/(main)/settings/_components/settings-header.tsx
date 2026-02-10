'use client';

import { useTranslations } from 'next-intl';

const SettingsHeader = () => {
  const t = useTranslations();

  return (
    <div className="space-y-1">
      <h1 className="text-xl font-bold tracking-tight">{t('settings.title')}</h1>
      <p className="text-muted-foreground text-sm">{t('settings.description')}</p>
    </div>
  );
};

export { SettingsHeader };
