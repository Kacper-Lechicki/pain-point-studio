import { useTranslations } from 'next-intl';
import type { UseFormReturn } from 'react-hook-form';

import { Combobox } from '@/components/ui/combobox';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { ROUTES } from '@/config/routes';
import type { SurveyCategoryOption } from '@/features/surveys/actions';
import { SURVEY_DESCRIPTION_MAX_LENGTH, SURVEY_TITLE_MAX_LENGTH } from '@/features/surveys/config';
import type { SurveyMetadataSchema } from '@/features/surveys/types';
import { Link } from '@/i18n/routing';

interface SurveyMetadataFieldsProps {
  form: UseFormReturn<SurveyMetadataSchema>;
  categoryOptions: SurveyCategoryOption[];
}

export function SurveyMetadataFields({ form, categoryOptions }: SurveyMetadataFieldsProps) {
  const t = useTranslations();

  return (
    <>
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

            <div className="flex items-baseline justify-between gap-2">
              <FormMessage />

              <span className="text-muted-foreground ml-auto shrink-0 text-xs">
                {t('surveys.create.titleCounter', {
                  count: (field.value ?? '').length,
                  max: SURVEY_TITLE_MAX_LENGTH,
                })}
              </span>
            </div>
          </FormItem>
        )}
      />

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

            <div className="flex items-baseline justify-between gap-2">
              <FormMessage />

              <span className="text-muted-foreground ml-auto shrink-0 text-xs">
                {t('surveys.create.descriptionCounter', {
                  count: (field.value ?? '').length,
                  max: SURVEY_DESCRIPTION_MAX_LENGTH,
                })}
              </span>
            </div>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="category"
        render={({ field, fieldState }) => (
          <FormItem>
            <FormLabel>{t('surveys.create.category')}</FormLabel>
            <FormDescription>
              {t.rich('surveys.create.categoryHelper', {
                link: (chunks) => (
                  <Link
                    href={ROUTES.dashboard.analyticsProjectIdea}
                    className="text-foreground underline underline-offset-2"
                  >
                    {chunks}
                  </Link>
                ),
              })}
            </FormDescription>

            <FormControl>
              <Combobox
                options={categoryOptions}
                value={field.value}
                onValueChange={field.onChange}
                placeholder={t('surveys.create.categoryPlaceholder')}
                searchPlaceholder={t('common.search')}
                emptyMessage={t('common.noResults')}
                aria-label={t('surveys.create.category')}
                aria-invalid={!!fieldState.error}
              />
            </FormControl>

            <FormMessage />
          </FormItem>
        )}
      />

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
                disabled
              />
            </FormControl>
          </FormItem>
        )}
      />
    </>
  );
}
