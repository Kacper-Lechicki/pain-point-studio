import { useMemo } from 'react';

import { addDays, format, isValid, parse } from 'date-fns';
import { useTranslations } from 'next-intl';
import { type Control, useFormContext, useWatch } from 'react-hook-form';

import { DateTimePicker } from '@/components/ui/date-time-picker';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { NumberInput } from '@/components/ui/number-input';
import { SURVEY_MAX_DURATION_DAYS } from '@/features/surveys/config';
import type { SurveyMetadataSchema } from '@/features/surveys/types';

interface SurveySchedulingFieldsProps {
  control: Control<SurveyMetadataSchema>;
}

function parseIso(value: string | null): Date | undefined {
  if (!value) {
    return undefined;
  }

  const date = parse(value, "yyyy-MM-dd'T'HH:mm", new Date());

  return isValid(date) ? date : undefined;
}

function formatIso(date: Date): string {
  return format(date, "yyyy-MM-dd'T'HH:mm");
}

export function SurveySchedulingFields({ control }: SurveySchedulingFieldsProps) {
  const t = useTranslations();
  const { setValue } = useFormContext<SurveyMetadataSchema>();
  const startsAt = useWatch({ control, name: 'startsAt' });
  const now = useMemo(() => new Date(), []);
  const startDate = parseIso(startsAt);
  const endDateMax = startDate ? addDays(startDate, SURVEY_MAX_DURATION_DAYS) : undefined;
  const endDateMin = startDate ?? now;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:items-start">
        <FormField
          control={control}
          name="startsAt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('surveys.create.startDate')}</FormLabel>
              <FormDescription>{t('surveys.create.startDateHelper')}</FormDescription>

              <FormControl>
                <DateTimePicker
                  value={field.value}
                  onChange={(value) => {
                    field.onChange(value);

                    if (value) {
                      const parsed = parseIso(value);

                      if (parsed) {
                        const autoEnd = addDays(parsed, SURVEY_MAX_DURATION_DAYS);

                        setValue('endsAt', formatIso(autoEnd), {
                          shouldDirty: true,
                          shouldValidate: true,
                        });
                      }
                    }
                  }}
                  onBlur={field.onBlur}
                  name={field.name}
                  placeholder={t('surveys.create.pickDate')}
                  disabledBefore={now}
                />
              </FormControl>

              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="endsAt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('surveys.create.endDate')}</FormLabel>
              <FormDescription>{t('surveys.create.endDateHelper')}</FormDescription>

              <FormControl>
                <DateTimePicker
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  name={field.name}
                  placeholder={t('surveys.create.pickDate')}
                  disabledBefore={endDateMin}
                  disabledAfter={endDateMax}
                />
              </FormControl>

              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={control}
        name="maxRespondents"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('surveys.create.maxRespondents')}</FormLabel>
            <FormDescription>{t('surveys.create.maxRespondentsHelper')}</FormDescription>

            <FormControl>
              <NumberInput
                min={1}
                placeholder={t('surveys.create.maxRespondentsPlaceholder')}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                name={field.name}
                ref={field.ref}
                className="sm:max-w-[240px]"
              />
            </FormControl>

            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
