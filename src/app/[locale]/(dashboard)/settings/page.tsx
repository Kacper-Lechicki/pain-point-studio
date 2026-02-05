import { getTranslations } from 'next-intl/server';

export default async function SettingsPage() {
  const t = await getTranslations();

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight">{t('common.settings')}</h1>
    </div>
  );
}
