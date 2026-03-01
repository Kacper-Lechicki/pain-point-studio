import { useTranslations } from 'next-intl';
import type { UseFormReturn } from 'react-hook-form';

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { PROJECT_NAME_MAX_LENGTH, PROJECT_SUMMARY_MAX_LENGTH } from '@/features/projects/config';
import type { CreateProjectInput } from '@/features/projects/types';

interface ProjectFormFieldsProps {
  form: UseFormReturn<CreateProjectInput>;
}

export function ProjectFormFields({ form }: ProjectFormFieldsProps) {
  const t = useTranslations();

  return (
    <>
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('projects.create.name')}</FormLabel>

            <FormControl>
              <Input
                placeholder={t('projects.create.namePlaceholder')}
                maxLength={PROJECT_NAME_MAX_LENGTH}
                {...field}
              />
            </FormControl>

            <div className="flex items-baseline justify-between gap-2">
              <FormMessage />

              <span className="text-muted-foreground ml-auto shrink-0 text-xs">
                {t('projects.create.nameCounter', {
                  count: (field.value ?? '').length,
                  max: PROJECT_NAME_MAX_LENGTH,
                })}
              </span>
            </div>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="summary"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('projects.create.summaryLabel')}</FormLabel>
            <FormDescription>{t('projects.create.summaryHelper')}</FormDescription>

            <FormControl>
              <Textarea
                placeholder={t('projects.create.summaryPlaceholder')}
                className="min-h-[120px] resize-none"
                rows={5}
                maxLength={PROJECT_SUMMARY_MAX_LENGTH}
                {...field}
              />
            </FormControl>

            <div className="flex items-baseline justify-between gap-2">
              <FormMessage />

              <span className="text-muted-foreground ml-auto shrink-0 text-xs">
                {t('projects.create.summaryCounter', {
                  count: (field.value ?? '').length,
                  max: PROJECT_SUMMARY_MAX_LENGTH,
                })}
              </span>
            </div>
          </FormItem>
        )}
      />
    </>
  );
}
