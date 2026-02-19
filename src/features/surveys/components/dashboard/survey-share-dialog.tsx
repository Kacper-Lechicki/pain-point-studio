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
          <DialogTitle>{t('surveys.dashboard.shareDialog.title')}</DialogTitle>
          <DialogDescription className="sr-only">
            {t('surveys.dashboard.shareDialog.title')}
          </DialogDescription>
        </DialogHeader>
        <div>
          <span className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
            {t('surveys.stats.surveyNameLabel')}
          </span>
          <p className="text-foreground truncate text-sm">{surveyTitle}</p>
        </div>
        <SurveyShareContent shareUrl={shareUrl} surveyTitle={surveyTitle} compact />
      </DialogContent>
    </Dialog>
  );
}
