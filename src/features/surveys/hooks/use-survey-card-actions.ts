'use client';

import { useState } from 'react';

import { useLocale } from 'next-intl';

import { getSurveyShareUrl } from '@/features/surveys/lib/share-url';

export function useSurveyCardActions(slug: string | null) {
  const locale = useLocale();

  const shareUrl = slug ? getSurveyShareUrl(locale, slug) : null;
  const [shareDialogOpen, setShareDialogOpen] = useState(false);

  const handleShare = () => {
    if (!shareUrl) {
      return;
    }

    setShareDialogOpen(true);
  };

  return { shareUrl, shareDialogOpen, setShareDialogOpen, handleShare };
}
