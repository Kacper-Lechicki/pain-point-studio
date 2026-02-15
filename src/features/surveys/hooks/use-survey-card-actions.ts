'use client';

import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { getSurveyShareUrl } from '@/features/surveys/lib/share-url';

export function useSurveyCardActions(slug: string | null) {
  const t = useTranslations();
  const locale = useLocale();

  const shareUrl = slug ? getSurveyShareUrl(locale, slug) : null;

  const handleShare = async () => {
    if (!shareUrl) {
      return;
    }

    await navigator.clipboard.writeText(shareUrl);
    toast.success(t('surveys.dashboard.toast.linkCopied'));
  };

  return { shareUrl, handleShare };
}
