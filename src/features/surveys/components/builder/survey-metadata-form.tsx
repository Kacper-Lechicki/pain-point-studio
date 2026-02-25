'use client';

import type React from 'react';

import { useRouter } from 'next/navigation';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { Spinner } from '@/components/ui/spinner';
import { ROUTES } from '@/config/routes';
import { createSurveyDraft } from '@/features/surveys/actions';
import type { ProjectOption } from '@/features/surveys/actions';
import { SurveyMetadataFields } from '@/features/surveys/components/builder/survey-metadata-fields';
import { getSurveyEditUrl } from '@/features/surveys/lib/survey-urls';
import {
  type DraftAction,
  SURVEY_VISIBILITY_VALUES,
  type SurveyMetadataSchema,
  surveyMetadataSchema,
} from '@/features/surveys/types';
import { useFormAction } from '@/hooks/common/use-form-action';
import { useUnsavedChangesWarning } from '@/hooks/unsaved-changes-context';
import type { MessageKey } from '@/i18n/types';

interface SurveyMetadataFormProps {
  projectOptions: ProjectOption[];
  defaultValues?: Partial<SurveyMetadataSchema>;
  surveyId?: string;
  mode?: 'create' | 'edit';
  onSaved?: () => void;
  renderFooter?: (props: {
    handleSave: () => void;
    isLoading: boolean;
    isDirty: boolean;
  }) => React.ReactNode;
}

const SurveyMetadataForm = ({
  projectOptions,
  defaultValues,
  surveyId,
  mode = 'create',
  onSaved,
  renderFooter,
}: SurveyMetadataFormProps) => {
  const t = useTranslations();
  const router = useRouter();

  const saveDraftAction = useFormAction({
    successMessage:
      mode === 'edit'
        ? ('surveys.builder.metadataUpdated' as MessageKey)
        : ('surveys.create.draftSaved' as MessageKey),
    unexpectedErrorMessage: 'surveys.errors.unexpected' as MessageKey,
    onSuccess: () => {
      if (mode === 'edit') {
        onSaved?.();
      } else {
        router.push(ROUTES.dashboard.research);
      }
    },
  });

  const nextAction = useFormAction({
    unexpectedErrorMessage: 'surveys.errors.unexpected' as MessageKey,
  });

  const form = useForm<SurveyMetadataSchema>({
    resolver: zodResolver(surveyMetadataSchema),
    defaultValues: {
      title: defaultValues?.title ?? '',
      description: defaultValues?.description ?? '',
      visibility: defaultValues?.visibility ?? SURVEY_VISIBILITY_VALUES[0],
      projectId: defaultValues?.projectId ?? null,
    },
  });

  const isLoading = saveDraftAction.isLoading || nextAction.isLoading;

  useUnsavedChangesWarning('survey-metadata-form', form.formState.isDirty);

  const handleSave = () => {
    void form.handleSubmit((data) => onSubmit(data, 'saveDraft'))();
  };

  async function onSubmit(data: SurveyMetadataSchema, actionType: DraftAction) {
    if (actionType === 'saveDraft') {
      await saveDraftAction.execute(createSurveyDraft, {
        ...data,
        surveyId,
        action: actionType,
      });
    } else {
      const result = await nextAction.execute(createSurveyDraft, {
        ...data,
        surveyId,
        action: actionType,
      });

      if (result?.data?.surveyId) {
        router.push(getSurveyEditUrl(result.data.surveyId));
      }
    }
  }

  const formFields = <SurveyMetadataFields form={form} projectOptions={projectOptions} />;

  if (renderFooter) {
    return (
      <Form {...form}>
        <form className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
            {formFields}
          </div>

          {renderFooter({ handleSave, isLoading, isDirty: form.formState.isDirty })}
        </form>
      </Form>
    );
  }

  return (
    <Form {...form}>
      <form className="space-y-6">
        {formFields}

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant={mode === 'edit' ? 'default' : 'outline'}
            disabled={isLoading}
            onClick={handleSave}
          >
            {saveDraftAction.isLoading && <Spinner />}
            {t('surveys.create.saveDraft')}
          </Button>

          {mode === 'create' && (
            <Button
              type="button"
              disabled={isLoading}
              onClick={form.handleSubmit((data) => onSubmit(data, 'next'))}
            >
              {nextAction.isLoading && <Spinner />}
              {t('surveys.create.next')}
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
};

export { SurveyMetadataForm };
