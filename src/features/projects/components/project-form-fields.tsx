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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  PROJECT_DESCRIPTION_MAX_LENGTH,
  PROJECT_NAME_MAX_LENGTH,
} from '@/features/projects/config';
import { PROJECT_CONTEXTS_CONFIG } from '@/features/projects/config/contexts';
import { PROJECT_CONTEXTS } from '@/features/projects/types';
import type { CreateProjectInput } from '@/features/projects/types';
import type { MessageKey } from '@/i18n/types';

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
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('projects.create.descriptionLabel')}</FormLabel>
            <FormDescription>{t('projects.create.descriptionHelper')}</FormDescription>

            <FormControl>
              <Textarea
                placeholder={t('projects.create.descriptionPlaceholder')}
                className="min-h-[120px] resize-none"
                rows={5}
                maxLength={PROJECT_DESCRIPTION_MAX_LENGTH}
                {...field}
              />
            </FormControl>

            <div className="flex items-baseline justify-between gap-2">
              <FormMessage />

              <span className="text-muted-foreground ml-auto shrink-0 text-xs">
                {t('projects.create.descriptionCounter', {
                  count: (field.value ?? '').length,
                  max: PROJECT_DESCRIPTION_MAX_LENGTH,
                })}
              </span>
            </div>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="context"
        render={({ field, fieldState }) => (
          <FormItem>
            <FormLabel>{t('projects.create.context')}</FormLabel>
            <FormDescription>{t('projects.create.contextHelper')}</FormDescription>

            <FormControl>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="w-full" aria-invalid={!!fieldState.error}>
                  <SelectValue placeholder={t('projects.create.contextPlaceholder')} />
                </SelectTrigger>

                <SelectContent>
                  {PROJECT_CONTEXTS.map((ctx) => (
                    <SelectItem key={ctx} value={ctx}>
                      {t(PROJECT_CONTEXTS_CONFIG[ctx].labelKey as MessageKey)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormControl>

            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}
