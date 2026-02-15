import { useTranslations } from 'next-intl';
import type { Control } from 'react-hook-form';

import { DateTimePicker } from '@/components/ui/date-time-picker';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import type { SurveyMetadataSchema } from '@/features/surveys/types';

interface SurveySchedulingFieldsProps {
  control: Control<SurveyMetadataSchema>;
}

export function SurveySchedulingFields({ control }: SurveySchedulingFieldsProps) {
  const t = useTranslations();

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium">{t('surveys.create.scheduling')}</h3>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:items-start">
        {/* Start date */}
        <FormField
          control={control}
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
          control={control}
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
        control={control}
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
  );
}
