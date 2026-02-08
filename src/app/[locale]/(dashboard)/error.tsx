'use client';

import { AlertTriangle, ArrowLeft, RotateCcw } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { ROUTES } from '@/config';
import { Link } from '@/i18n/routing';

interface DashboardErrorProps {
  reset: () => void;
}

export default function DashboardError({ reset }: DashboardErrorProps) {
  const t = useTranslations('common.error');

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 text-center">
      <AlertTriangle className="text-destructive size-12" />

      <div className="space-y-2">
        <h1 className="text-xl font-semibold">{t('title')}</h1>
        <p className="text-muted-foreground text-sm">{t('description')}</p>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" size="sm" onClick={reset}>
          <RotateCcw className="size-4" />
          {t('retry')}
        </Button>

        <Button variant="default" size="sm" asChild>
          <Link href={ROUTES.common.dashboard}>
            <ArrowLeft className="size-4" />
            {t('backToDashboard')}
          </Link>
        </Button>
      </div>
    </div>
  );
}
