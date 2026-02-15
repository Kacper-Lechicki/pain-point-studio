'use client';

import { AlertTriangle, ArrowLeft, RotateCcw } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import type { AppRoute } from '@/config/routes';
import { Link } from '@/i18n/routing';

interface ErrorPageProps {
  reset: () => void;
  backHref: AppRoute;
  backLabelKey: string;
}

const ErrorPage = ({ reset, backHref, backLabelKey }: ErrorPageProps) => {
  const t = useTranslations();

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 text-center">
      <AlertTriangle className="text-destructive size-12" />

      <div className="space-y-2">
        <h1 className="text-xl font-semibold">{t('common.error.title')}</h1>
        <p className="text-muted-foreground text-xs">{t('common.error.description')}</p>
      </div>

      <div className="flex gap-3">
        <Button variant="default" asChild>
          <Link href={backHref}>
            <ArrowLeft className="size-4" />
            {t(`common.error.${backLabelKey}` as Parameters<typeof t>[0])}
          </Link>
        </Button>

        <Button variant="outline" onClick={reset}>
          <RotateCcw className="size-4" />
          {t('common.error.retry')}
        </Button>
      </div>
    </div>
  );
};

export { ErrorPage };
