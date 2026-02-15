'use client';

import { useTranslations } from 'next-intl';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { SurveyShareContent } from '@/features/surveys/components/builder/survey-share-content';

interface SurveyShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shareUrl: string;
  surveyTitle: string;
}

export function SurveyShareDialog({
  open,
  onOpenChange,
  shareUrl,
  surveyTitle,
}: SurveyShareDialogProps) {
  const t = useTranslations();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">
            {t('surveys.dashboard.shareDialog.title')}
          </DialogTitle>
          <DialogDescription>{surveyTitle}</DialogDescription>
        </DialogHeader>
        <SurveyShareContent shareUrl={shareUrl} surveyTitle={surveyTitle} compact />
      </DialogContent>
    </Dialog>
  );
}
