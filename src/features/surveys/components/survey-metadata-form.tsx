'use client';

import type React from 'react';

import { useRouter } from 'next/navigation';

import { zodResolver } from '@hookform/resolvers/zod';
import { Info } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { DateTimePicker } from '@/components/ui/date-time-picker';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Spinner } from '@/components/ui/spinner';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ROUTES } from '@/config/routes';
import { createSurveyDraft } from '@/features/surveys/actions';
import type { SurveyCategoryOption } from '@/features/surveys/actions';
import { SURVEY_DESCRIPTION_MAX_LENGTH, SURVEY_TITLE_MAX_LENGTH } from '@/features/surveys/config';
import { type SurveyMetadataSchema, surveyMetadataSchema } from '@/features/surveys/types';
import { useFormAction } from '@/hooks/common/use-form-action';
import type { MessageKey } from '@/i18n/types';

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
      visibility: defaultValues?.visibility ?? 'private',
      startsAt: defaultValues?.startsAt ?? null,
      endsAt: defaultValues?.endsAt ?? null,
      maxRespondents: defaultValues?.maxRespondents ?? null,
    },
  });

  const isLoading = saveDraftAction.isLoading || nextAction.isLoading;

  const handleSave = () => {
    void form.handleSubmit((data) => onSubmit(data, 'saveDraft'))();
  };

  async function onSubmit(data: SurveyMetadataSchema, actionType: 'saveDraft' | 'next') {
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
        router.push(`/dashboard/surveys/new/${result.data.surveyId}`);
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
            <FormControl>
              <Textarea
                placeholder={t('surveys.create.surveyDescriptionPlaceholder')}
                className="min-h-[120px] resize-none"
                rows={5}
                maxLength={SURVEY_DESCRIPTION_MAX_LENGTH}
                {...field}
              />
            </FormControl>
            <div className="flex items-center justify-between gap-2">
              <FormDescription>{t('surveys.create.surveyDescriptionHelper')}</FormDescription>
              <span className="text-muted-foreground shrink-0 text-xs">
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
            <Select name="category" onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger className="w-full" aria-label={t('surveys.create.category')}>
                  <SelectValue placeholder={t('surveys.create.categoryPlaceholder')} />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {categoryOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Visibility */}
      <FormField
        control={form.control}
        name="visibility"
        render={({ field }) => (
          <FormItem className="flex items-center justify-between gap-4 rounded-lg border p-4">
            <div className="space-y-0.5">
              <FormLabel className="flex items-center gap-1.5">
                {t('surveys.create.visibility')}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button type="button" className="inline-flex">
                        <Info className="text-muted-foreground size-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="max-w-xs">
                      {t('surveys.create.visibilityTooltip')}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </FormLabel>
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

      {/* Scheduling section */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium">{t('surveys.create.scheduling')}</h3>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:items-start">
          {/* Start date */}
          <FormField
            control={form.control}
            name="startsAt"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('surveys.create.startDate')}</FormLabel>
                <FormControl>
                  <DateTimePicker
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    name={field.name}
                    placeholder={t('surveys.create.pickDate')}
                  />
                </FormControl>
                <FormDescription className="min-h-[2.5rem]">
                  {t('surveys.create.startDateHelper')}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* End date */}
          <FormField
            control={form.control}
            name="endsAt"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('surveys.create.endDate')}</FormLabel>
                <FormControl>
                  <DateTimePicker
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    name={field.name}
                    placeholder={t('surveys.create.pickDate')}
                  />
                </FormControl>
                <FormDescription className="min-h-[2.5rem]">
                  {t('surveys.create.endDateHelper')}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Max respondents */}
        <FormField
          control={form.control}
          name="maxRespondents"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('surveys.create.maxRespondents')}</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={1}
                  placeholder={t('surveys.create.maxRespondentsPlaceholder')}
                  value={field.value ?? ''}
                  onChange={(e) =>
                    field.onChange(e.target.value === '' ? null : Number(e.target.value))
                  }
                  onBlur={field.onBlur}
                  name={field.name}
                  ref={field.ref}
                  className="sm:max-w-[200px]"
                />
              </FormControl>
              <FormDescription>{t('surveys.create.maxRespondentsHelper')}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </>
  );

  if (renderFooter) {
    return (
      <Form {...form}>
        <form className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-6 py-6">{formFields}</div>
          {renderFooter({ handleSave, isLoading })}
        </form>
      </Form>
    );
  }

  return (
    <Form {...form}>
      <form className="space-y-6">
        {formFields}

        <Separator />

        {/* Actions */}
        <div
          className={`flex items-center gap-3 ${mode === 'edit' ? 'justify-end' : 'justify-between'}`}
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
