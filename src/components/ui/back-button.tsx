'use client';

import { ArrowLeft } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { useRouter } from '@/i18n/routing';

const BackButton = () => {
  const t = useTranslations();
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.back()}
      className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-sm transition-colors"
    >
      <ArrowLeft className="size-4" />
      {t('common.goBack')}
    </button>
  );
};

export { BackButton };
