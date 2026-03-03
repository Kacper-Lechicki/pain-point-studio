import { ArrowLeft, FileQuestion } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

import { Button } from '@/components/ui/button';
import { ROUTES } from '@/config';
import { Link } from '@/i18n/routing';

export default async function LocaleNotFound() {
  const t = await getTranslations();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <FileQuestion className="text-muted-foreground size-16" />

      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">{t('common.notFound.title')}</h1>
        <p className="text-muted-foreground max-w-md text-sm">{t('common.notFound.description')}</p>
      </div>

      <Button variant="default" asChild>
        <Link href={ROUTES.common.home}>
          <ArrowLeft className="size-4" />
          {t('common.notFound.backToHome')}
        </Link>
      </Button>
    </div>
  );
}
