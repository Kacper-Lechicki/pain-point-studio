'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { SubmitButton } from '@/components/ui/submit-button';
import { updateEmail } from '@/features/settings/actions';
import { SettingsSectionHeader } from '@/features/settings/components/settings-section-header';
import { UpdateEmailSchema, updateEmailSchema } from '@/features/settings/types';
import { useFormAction } from '@/hooks/common/use-form-action';
import type { MessageKey } from '@/i18n/types';

interface EmailFormProps {
  currentEmail: string;
}

const EmailForm = ({ currentEmail }: EmailFormProps) => {
  const t = useTranslations();

  const { isLoading, execute } = useFormAction({
    successMessage: 'settings.email.emailUpdateSent' as MessageKey,
    unexpectedErrorMessage: 'settings.errors.unexpected' as MessageKey,
  });

  const form = useForm<UpdateEmailSchema>({
    resolver: zodResolver(updateEmailSchema),
    defaultValues: {
      email: currentEmail,
    },
  });

  async function onSubmit(data: UpdateEmailSchema) {
    await execute(updateEmail, data);
  }

  return (
    <section className="space-y-8">
      <SettingsSectionHeader
        title={t('settings.email.title')}
        description={t('settings.email.description')}
        hintContent={t('settings.email.doubleConfirmHint')}
        hintDialogTitle={t('settings.email.title')}
      />

      <Form {...form}>
        <form id="email-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('settings.email.newEmail')}</FormLabel>

                <FormControl>
                  <Input
                    type="email"
                    placeholder={t('settings.email.newEmailPlaceholder')}
                    {...field}
                  />
                </FormControl>

                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end">
            <SubmitButton isLoading={isLoading} form="email-form">
              {t('settings.email.saveEmail')}
            </SubmitButton>
          </div>
        </form>
      </Form>
    </section>
  );
};

export { EmailForm };
