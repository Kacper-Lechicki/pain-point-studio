'use client';

import { CheckCircle2, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { ROUTES } from '@/config/routes';
import { getSurveyStatsUrl } from '@/features/surveys/lib/survey-urls';
import Link from '@/i18n/link';

import { SurveyShareContent } from './survey-share-content';

interface PublishSuccessDialogProps {
  open: boolean;
  shareUrl: string;
  surveyId: string;
  surveyTitle: string;
  onClose: () => void;
}

export function PublishSuccessDialog({
  open,
  shareUrl,
  surveyId,
  surveyTitle,
  onClose,
}: PublishSuccessDialogProps) {
  const t = useTranslations('surveys.publish');

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          onClose();
        }
      }}
    >
      <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader className="items-center text-center">
          <div className="bg-success/10 mb-2 flex size-14 items-center justify-center rounded-full">
            <CheckCircle2 className="text-success size-7" />
          </div>
          <DialogTitle>{t('successTitle', { name: surveyTitle })}</DialogTitle>
          <DialogDescription>{t('successDescription')}</DialogDescription>
        </DialogHeader>

        <SurveyShareContent shareUrl={shareUrl} surveyTitle={surveyTitle} />

        <Separator />

        <DialogFooter>
          <Button variant="outline" size="sm" asChild>
            <Link href={ROUTES.dashboard.surveysNew}>
              <Plus className="size-3.5" />
              {t('createAnother')}
            </Link>
          </Button>
          <Button size="sm" asChild>
            <Link href={getSurveyStatsUrl(surveyId)}>{t('viewDashboard')}</Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
