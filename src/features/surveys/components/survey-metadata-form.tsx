'use client';

import type React from 'react';

import { useRouter } from 'next/navigation';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Combobox } from '@/components/ui/combobox';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Spinner } from '@/components/ui/spinner';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { ROUTES } from '@/config/routes';
import { createSurveyDraft } from '@/features/surveys/actions';
import type { SurveyCategoryOption } from '@/features/surveys/actions';
import { SurveySchedulingFields } from '@/features/surveys/components/survey-scheduling-fields';
import { SURVEY_DESCRIPTION_MAX_LENGTH, SURVEY_TITLE_MAX_LENGTH } from '@/features/surveys/config';
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
import { cn } from '@/lib/common/utils';

interface SurveyMetadataFormProps {
  categoryOptions: SurveyCategoryOption[];
  defaultValues?: Partial<SurveyMetadataSchema>;
  surveyId?: string;
  /** When 'edit', hides the Next button and calls onSaved on success. */
  mode?: 'create' | 'edit';
  onSaved?: () => void;
  /** Render prop for externally positioned footer. When provided, built-in actions are hidden. */
  renderFooter?: (props: { handleSave: () => void; isLoading: boolean }) => React.ReactNode;
}

const SurveyMetadataForm = ({
  categoryOptions,
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
        router.push(ROUTES.dashboard.surveys);
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
      category: defaultValues?.category ?? '',
      visibility: defaultValues?.visibility ?? SURVEY_VISIBILITY_VALUES[0],
      startsAt: defaultValues?.startsAt ?? null,
      endsAt: defaultValues?.endsAt ?? null,
      maxRespondents: defaultValues?.maxRespondents ?? null,
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

  const formFields = (
    <>
      {/* Title */}
      <FormField
        control={form.control}
        name="title"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('surveys.create.surveyTitle')}</FormLabel>
            <FormControl>
              <Input
                placeholder={t('surveys.create.surveyTitlePlaceholder')}
                maxLength={SURVEY_TITLE_MAX_LENGTH}
                {...field}
              />
            </FormControl>
            <div className="flex justify-end">
              <span className="text-muted-foreground text-xs">
                {t('surveys.create.titleCounter', {
                  count: (field.value ?? '').length,
                  max: SURVEY_TITLE_MAX_LENGTH,
                })}
              </span>
            </div>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Description */}
      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('surveys.create.surveyDescription')}</FormLabel>
            <FormDescription>{t('surveys.create.surveyDescriptionHelper')}</FormDescription>
            <FormControl>
              <Textarea
                placeholder={t('surveys.create.surveyDescriptionPlaceholder')}
                className="min-h-[120px] resize-none"
                rows={5}
                maxLength={SURVEY_DESCRIPTION_MAX_LENGTH}
                {...field}
              />
            </FormControl>
            <div className="flex justify-end">
              <span className="text-muted-foreground text-xs">
                {t('surveys.create.descriptionCounter', {
                  count: (field.value ?? '').length,
                  max: SURVEY_DESCRIPTION_MAX_LENGTH,
                })}
              </span>
            </div>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Category */}
      <FormField
        control={form.control}
        name="category"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('surveys.create.category')}</FormLabel>
            <FormDescription>{t('surveys.create.categoryHelper')}</FormDescription>
            <FormControl>
              <Combobox
                options={[...categoryOptions].sort((a, b) => {
                  if (a.value === 'other') {
                    return 1;
                  }

                  if (b.value === 'other') {
                    return -1;
                  }

                  return a.label.localeCompare(b.label);
                })}
                value={field.value}
                onValueChange={field.onChange}
                placeholder={t('surveys.create.categoryPlaceholder')}
                searchPlaceholder={t('common.search')}
                emptyMessage={t('common.noResults')}
                aria-label={t('surveys.create.category')}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Visibility */}
      <FormField
        control={form.control}
        name="visibility"
        render={({ field }) => (
          <FormItem className="flex items-start justify-between gap-4 rounded-lg border p-3 sm:p-4">
            <div className="min-w-0 space-y-0.5">
              <FormLabel>{t('surveys.create.visibility')}</FormLabel>
              <FormDescription>
                {field.value === 'public'
                  ? t('surveys.create.visibilityPublicDescription')
                  : t('surveys.create.visibilityPrivateDescription')}
              </FormDescription>
            </div>
            <FormControl>
              <Switch
                checked={field.value === 'public'}
                onCheckedChange={(checked) => field.onChange(checked ? 'public' : 'private')}
              />
            </FormControl>
          </FormItem>
        )}
      />

      <Separator />

      <SurveySchedulingFields control={form.control} />
    </>
  );

  if (renderFooter) {
    return (
      <Form {...form}>
        <form className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
            {formFields}
          </div>
          {renderFooter({ handleSave, isLoading })}
        </form>
      </Form>
    );
  }

  return (
    <Form {...form}>
      <form className="space-y-6">
        {formFields}

        {/* Actions */}
        <div
          className={cn(
            'flex items-center gap-3',
            mode === 'edit' ? 'justify-end' : 'justify-between'
          )}
        >
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
