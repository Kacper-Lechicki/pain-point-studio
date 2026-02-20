'use client';

import { CheckCircle2, ClipboardList, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { ROUTES } from '@/config/routes';
import { SurveyShareContent } from '@/features/surveys/components/builder/survey-share-content';
import { getSurveyStatsUrl } from '@/features/surveys/lib/survey-urls';
import Link from '@/i18n/link';

interface PublishSuccessPanelProps {
  open: boolean;
  onClose: () => void;
  shareUrl: string;
  surveyId: string;
  surveyTitle: string;
}

export function PublishSuccessPanel({
  open,
  onClose,
  shareUrl,
  surveyId,
  surveyTitle,
}: PublishSuccessPanelProps) {
  const t = useTranslations();

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent
        side="right"
        className="flex h-full w-[85%] max-w-[420px] flex-col gap-0 overflow-y-auto p-0 sm:max-w-[420px]"
        showCloseButton
      >
        <SheetHeader className="border-border h-14 shrink-0 flex-row items-center gap-0 border-b px-4 py-0 pr-12">
          <SheetTitle className="text-foreground text-base font-semibold">
            {t('surveys.publish.panelTitle')}
          </SheetTitle>

          <SheetDescription className="sr-only">{surveyTitle}</SheetDescription>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-4 pb-8">
          <div className="mb-5 flex flex-col items-center text-center">
            <div className="bg-success/10 mb-2 flex size-10 items-center justify-center rounded-full">
              <CheckCircle2 className="text-success size-5" />
            </div>

            <h3 className="text-sm font-semibold">
              {t('surveys.publish.successTitle', { name: surveyTitle })}
            </h3>

            <p className="text-muted-foreground mt-0.5 text-xs">
              {t('surveys.publish.successDescription')}
            </p>
          </div>

          <SurveyShareContent shareUrl={shareUrl} surveyTitle={surveyTitle} compact />
          <Separator className="my-5" />

          <div className="flex flex-col gap-2">
            <Button size="sm" asChild>
              <Link href={getSurveyStatsUrl(surveyId)} replace>
                {t('surveys.publish.viewDashboard')}
              </Link>
            </Button>

            <Button variant="outline" size="sm" asChild>
              <Link href={ROUTES.dashboard.researchNew} replace>
                <Plus className="size-3.5" />
                {t('surveys.publish.createAnother')}
              </Link>
            </Button>

            <Button variant="ghost" size="sm" asChild>
              <Link href={ROUTES.dashboard.research} replace>
                <ClipboardList className="size-3.5" />
                {t('surveys.publish.backToSurveys')}
              </Link>
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
