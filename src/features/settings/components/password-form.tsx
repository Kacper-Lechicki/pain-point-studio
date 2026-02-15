'use client';

import { useRouter } from 'next/navigation';

import { zodResolver } from '@hookform/resolvers/zod';
import { Info } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useForm, useWatch } from 'react-hook-form';

import { Alert, AlertDescription } from '@/components/ui/alert';
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
import { changePassword, setPassword } from '@/features/settings/actions';
import { SettingsSectionHeader } from '@/features/settings/components/settings-section-header';
import {
  ChangePasswordSchema,
  SetPasswordSchema,
  changePasswordSchema,
  setPasswordSchema,
} from '@/features/settings/types';
import { useFormAction } from '@/hooks/common/use-form-action';
import { useUnsavedChangesWarning } from '@/hooks/unsaved-changes-context';
import type { MessageKey } from '@/i18n/types';

interface PasswordFormProps {
  hasPassword: boolean;
}

const PasswordForm = ({ hasPassword }: PasswordFormProps) => {
  const t = useTranslations();
  const router = useRouter();

  const schema = hasPassword ? changePasswordSchema : setPasswordSchema;

  const form = useForm<ChangePasswordSchema | SetPasswordSchema>({
    resolver: zodResolver(schema),
    defaultValues: hasPassword
      ? { currentPassword: '', password: '', confirmPassword: '' }
      : { password: '', confirmPassword: '' },
  });

  const { isLoading, execute } = useFormAction({
    successMessage: 'settings.password.passwordUpdated' as MessageKey,
    unexpectedErrorMessage: 'settings.errors.unexpected' as MessageKey,
    onSuccess: () => {
      form.reset();
      router.refresh();
    },
  });

  useUnsavedChangesWarning('password-form', form.formState.isDirty);

  const password = useWatch({
    control: form.control,
    name: 'password',
    defaultValue: '',
  });

  const hintContent = hasPassword
    ? t('settings.password.currentPasswordHint')
    : t('settings.password.setFirstHint');

  async function onSubmit(data: ChangePasswordSchema | SetPasswordSchema) {
    if (hasPassword) {
      await execute(changePassword, data as ChangePasswordSchema);
    } else {
      await execute(setPassword, data as SetPasswordSchema);
    }
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
                    <PasswordInput autoComplete="current-password" {...field} />
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
                  <PasswordInput autoComplete="new-password" {...field} />
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
                  <PasswordInput autoComplete="new-password" {...field} />
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

      <Alert variant="info" className="text-xs">
        <Info className="size-3.5" />
        <AlertDescription>{hintContent}</AlertDescription>
      </Alert>
    </section>
  );
};

export { PasswordForm };
