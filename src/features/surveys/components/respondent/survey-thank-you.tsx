'use client';

import { CheckCircle2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { PageTransition } from '@/components/ui/page-transition';

export const SurveyThankYou = () => {
  const t = useTranslations('respondent.thankYou');

  return (
    <PageTransition>
      <div className="flex flex-col items-center py-16 text-center">
        <div className="bg-success/10 mb-6 flex size-16 items-center justify-center rounded-full">
          <CheckCircle2 className="text-success size-8" />
        </div>
        <h1 className="text-foreground mb-2 text-xl font-semibold">{t('title')}</h1>
        <p className="text-muted-foreground max-w-sm">{t('description')}</p>
      </div>
    </PageTransition>
  );
};
