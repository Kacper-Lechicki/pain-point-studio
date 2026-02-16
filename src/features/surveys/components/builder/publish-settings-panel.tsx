'use client';

import { useMemo, useState } from 'react';

import { Info } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { Label } from '@/components/ui/label';
import { NumberInput } from '@/components/ui/number-input';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Spinner } from '@/components/ui/spinner';
import { publishSurvey, saveSurveyQuestions } from '@/features/surveys/actions';
import { useQuestionBuilderContext } from '@/features/surveys/hooks/use-question-builder-context';
import { useFormAction } from '@/hooks/common/use-form-action';
import type { MessageKey } from '@/i18n/types';

interface PublishSettingsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  surveyId: string;
  onPublished: (slug: string) => void;
}

export function PublishSettingsPanel({
  open,
  onOpenChange,
  surveyId,
  onPublished,
}: PublishSettingsPanelProps) {
  const t = useTranslations();
  const { state, dispatch, buildQuestionsPayload } = useQuestionBuilderContext();

  const [endsAt, setEndsAt] = useState<string | null>(null);
  const [maxRespondents, setMaxRespondents] = useState<number | null>(null);

  const now = useMemo(() => new Date(), []);

  const saveAction = useFormAction({
    unexpectedErrorMessage: 'surveys.builder.errors.saveFailed' as MessageKey,
    onSuccess: () => {
      dispatch({ type: 'MARK_CLEAN' });
      dispatch({ type: 'SET_SAVE_STATUS', payload: { status: 'saved' } });
    },
    onError: () => {
      dispatch({ type: 'SET_SAVE_STATUS', payload: { status: 'error' } });
    },
  });

  const publishAction = useFormAction<{ slug: string }>({
    successMessage: 'surveys.builder.published' as MessageKey,
    unexpectedErrorMessage: 'surveys.errors.unexpected' as MessageKey,
    onSuccess: (data) => {
      if (data?.slug) {
        onPublished(data.slug);
      }
    },
  });

  const isLoading = saveAction.isLoading || publishAction.isLoading;

  async function handlePublish() {
    dispatch({ type: 'SET_SAVE_STATUS', payload: { status: 'saving' } });
    const saveResult = await saveAction.execute(saveSurveyQuestions, {
      surveyId,
      questions: buildQuestionsPayload(),
    });

    if (saveResult?.error) {
      toast.error(t('surveys.builder.errors.saveFailed' as MessageKey));

      return;
    }

    await publishAction.execute(publishSurvey, {
      surveyId,
      endsAt,
      maxRespondents,
    });
  }

  const hasQuestions = state.questions.some((q) => q.text.trim().length > 0);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex h-full w-full flex-col gap-0 overflow-hidden p-0 sm:w-[85%] sm:max-w-[420px]"
        showCloseButton
      >
        <SheetHeader className="border-border h-14 shrink-0 flex-row items-center gap-0 border-b px-3 py-0 pr-12 sm:px-4">
          <SheetTitle className="text-foreground text-base font-semibold">
            {t('surveys.publish.settingsTitle')}
          </SheetTitle>
          <SheetDescription className="sr-only">
            {t('surveys.publish.settingsDescription')}
          </SheetDescription>
        </SheetHeader>

        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-4 py-6">
          <Alert variant="info" className="text-xs">
            <Info className="size-3.5" />
            <AlertDescription>{t('surveys.publish.settingsHint')}</AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label>{t('surveys.publish.endDate')}</Label>
            <p className="text-muted-foreground text-xs">{t('surveys.publish.endDateHelper')}</p>
            <DateTimePicker
              value={endsAt}
              onChange={setEndsAt}
              placeholder={t('surveys.publish.noEndDate')}
              disabledBefore={now}
            />
          </div>

          <div className="space-y-2">
            <Label>{t('surveys.publish.maxRespondents')}</Label>
            <p className="text-muted-foreground text-xs">
              {t('surveys.publish.maxRespondentsHelper')}
            </p>
            <NumberInput
              min={1}
              placeholder={t('surveys.publish.unlimited')}
              value={maxRespondents}
              onChange={setMaxRespondents}
            />
          </div>
        </div>

        <div className="border-border shrink-0 border-t px-3 py-4 sm:px-4">
          <Button className="w-full" disabled={isLoading || !hasQuestions} onClick={handlePublish}>
            {isLoading && <Spinner />}
            {t('surveys.publish.publishButton')}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
