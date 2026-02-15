'use client';

import { useRouter } from 'next/navigation';

import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Spinner } from '@/components/ui/spinner';
import type { SurveyCategoryOption } from '@/features/surveys/actions';
import { SurveyMetadataForm } from '@/features/surveys/components/survey-metadata-form';
import type { SurveyMetadataSchema } from '@/features/surveys/types';

interface BuilderMetadataPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  surveyId: string;
  surveyTitle: string;
  surveyMetadata: Omit<SurveyMetadataSchema, 'title'>;
  categoryOptions: SurveyCategoryOption[];
}

export function BuilderMetadataPanel({
  open,
  onOpenChange,
  surveyId,
  surveyTitle,
  surveyMetadata,
  categoryOptions,
}: BuilderMetadataPanelProps) {
  const t = useTranslations();
  const router = useRouter();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex h-full w-full flex-col gap-0 overflow-hidden p-0 sm:w-[85%] sm:max-w-[420px]"
        showCloseButton
      >
        <SheetHeader className="border-border h-14 shrink-0 flex-row items-center gap-0 border-b px-3 py-0 pr-12 sm:px-4">
          <SheetTitle className="text-foreground text-base font-semibold">
            {t('surveys.builder.editMetadata')}
          </SheetTitle>
          <SheetDescription className="sr-only">
            {t('surveys.builder.editMetadata')}
          </SheetDescription>
        </SheetHeader>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <SurveyMetadataForm
            categoryOptions={categoryOptions}
            surveyId={surveyId}
            mode="edit"
            defaultValues={{
              title: surveyTitle,
              ...surveyMetadata,
            }}
            onSaved={() => {
              onOpenChange(false);
              router.refresh();
            }}
            renderFooter={({ handleSave, isLoading: formLoading }) => (
              <div className="border-border shrink-0 border-t px-3 py-4 sm:px-4">
                <Button className="w-full" disabled={formLoading} onClick={handleSave}>
                  {formLoading && <Spinner />}
                  {t('surveys.create.saveDraft')}
                </Button>
              </div>
            )}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
