'use client';

import { useRouter } from 'next/navigation';

import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { duplicateSurvey } from '@/features/surveys/actions';
import { getSurveyShareUrl } from '@/features/surveys/lib/share-url';
import { getSurveyEditUrl } from '@/features/surveys/lib/survey-urls';

export function useSurveyCardActions(surveyId: string, slug: string | null) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();

  const shareUrl = slug ? getSurveyShareUrl(locale, slug) : null;

  const handleShare = async () => {
    if (!shareUrl) {
      return;
    }

    await navigator.clipboard.writeText(shareUrl);
    toast.success(t('surveys.dashboard.toast.linkCopied'));
  };

  const handleDuplicate = async () => {
    const result = await duplicateSurvey({ surveyId });

    if (result.success && result.data) {
      toast.success(t('surveys.dashboard.toast.duplicated'));
      router.push(getSurveyEditUrl(result.data.surveyId));
    }
  };

  return { shareUrl, handleShare, handleDuplicate };
}
