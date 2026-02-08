'use client';

import { useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { InfoHint } from '@/components/ui/info-hint';
import { PasswordInput } from '@/components/ui/password-input';
import { Spinner } from '@/components/ui/spinner';
import { PasswordStrength } from '@/features/auth/components/common/password-strength';
import { changePassword } from '@/features/settings/actions';
import { ChangePasswordSchema, changePasswordSchema } from '@/features/settings/types';
import type { MessageKey } from '@/i18n/types';

interface PasswordFormProps {
  hasPassword: boolean;
}

const PasswordForm = ({ hasPassword }: PasswordFormProps) => {
  const t = useTranslations();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<ChangePasswordSchema>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      password: '',
      confirmPassword: '',
    },
  });

  const password = useWatch({
    control: form.control,
    name: 'password',
    defaultValue: '',
  });

  const hintContent = hasPassword
    ? t('settings.password.currentPasswordHint')
    : t('settings.password.setFirstHint');

  async function onSubmit(data: ChangePasswordSchema) {
    setIsLoading(true);

    try {
      const result = await changePassword(data);

      if (result.error) {
        toast.error(t(result.error as MessageKey));
      } else {
        toast.success(t('settings.password.passwordUpdated'));
        form.reset();
      }
    } catch {
      toast.error(t('settings.errors.unexpected'));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="space-y-8">
      <div className="border-border/40 space-y-1 border-b pb-6">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">{t('settings.password.title')}</h2>

          <InfoHint content={hintContent} dialogTitle={t('settings.password.title')} />
        </div>

        <p className="text-muted-foreground text-sm">
          {hasPassword
            ? t('settings.password.description')
            : t('settings.password.setFirstDescription')}
        </p>
      </div>

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
                    <PasswordInput
                      placeholder={t('auth.passwordPlaceholder')}
                      showPasswordLabel={t('auth.showPassword')}
                      hidePasswordLabel={t('auth.hidePassword')}
                      {...field}
                    />
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
                  <PasswordInput
                    placeholder={t('auth.passwordPlaceholder')}
                    showPasswordLabel={t('auth.showPassword')}
                    hidePasswordLabel={t('auth.hidePassword')}
                    {...field}
                  />
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
                  <PasswordInput
                    placeholder={t('auth.passwordPlaceholder')}
                    showPasswordLabel={t('auth.showPassword')}
                    hidePasswordLabel={t('auth.hidePassword')}
                    {...field}
                  />
                </FormControl>

                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end">
            <Button type="submit" form="password-form" disabled={isLoading}>
              {isLoading && <Spinner />}
              {t('settings.password.savePassword')}
            </Button>
          </div>
        </form>
      </Form>
    </section>
  );
};

export { PasswordForm };
