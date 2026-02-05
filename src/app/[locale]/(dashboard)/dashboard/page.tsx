import { getTranslations } from 'next-intl/server';

export default async function DashboardPage() {
  const t = await getTranslations();

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <p className="text-muted-foreground mt-4 text-sm">{t('dashboard.empty')}</p>
    </div>
  );
}
