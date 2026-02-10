'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useForm, useWatch } from 'react-hook-form';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { PasswordInput } from '@/components/ui/password-input';
import { SubmitButton } from '@/components/ui/submit-button';
import { PasswordStrength } from '@/features/auth/components/common/password-strength';
import { updatePassword } from '@/features/settings/actions';
import { SettingsSectionHeader } from '@/features/settings/components/settings-section-header';
import { UpdatePasswordSchema, updatePasswordSchema } from '@/features/settings/types';
import { useFormAction } from '@/hooks/common/use-form-action';
import type { MessageKey } from '@/i18n/types';

interface PasswordFormProps {
  hasPassword: boolean;
}

const PasswordForm = ({ hasPassword }: PasswordFormProps) => {
  const t = useTranslations();

  const form = useForm<UpdatePasswordSchema>({
    resolver: zodResolver(updatePasswordSchema),
    defaultValues: {
      currentPassword: '',
      password: '',
      confirmPassword: '',
    },
  });

  const { isLoading, execute } = useFormAction({
    successMessage: 'settings.password.passwordUpdated' as MessageKey,
    unexpectedErrorMessage: 'settings.errors.unexpected' as MessageKey,
    onSuccess: () => form.reset(),
  });

  const password = useWatch({
    control: form.control,
    name: 'password',
    defaultValue: '',
  });

  const hintContent = hasPassword
    ? t('settings.password.currentPasswordHint')
    : t('settings.password.setFirstHint');

  async function onSubmit(data: UpdatePasswordSchema) {
    await execute(updatePassword, data);
  }

  return (
    <section className="space-y-8">
      <SettingsSectionHeader
        title={t('settings.password.title')}
        description={
          hasPassword
            ? t('settings.password.description')
            : t('settings.password.setFirstDescription')
        }
        hintContent={hintContent}
        hintDialogTitle={t('settings.password.title')}
      />

      <Form {...form}>
        <form id="password-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {hasPassword && (
            <FormField
              control={form.control}
              name="currentPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('settings.password.currentPassword')}</FormLabel>

                  <FormControl>
                    <PasswordInput {...field} />
                  </FormControl>

                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('settings.password.newPassword')}</FormLabel>

                <FormControl>
                  <PasswordInput {...field} />
                </FormControl>

                <PasswordStrength password={password} isError={!!form.formState.errors.password} />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('settings.password.confirmPassword')}</FormLabel>

                <FormControl>
                  <PasswordInput {...field} />
                </FormControl>

                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end">
            <SubmitButton isLoading={isLoading} form="password-form">
              {t('settings.password.savePassword')}
            </SubmitButton>
          </div>
        </form>
      </Form>
    </section>
  );
};

export { PasswordForm };
