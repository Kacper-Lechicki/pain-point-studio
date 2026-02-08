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
import { PasswordInput } from '@/components/ui/password-input';
import { Spinner } from '@/components/ui/spinner';
import { ROUTES } from '@/config';
import { updatePassword } from '@/features/auth/actions';
import { UpdatePasswordSchema, updatePasswordSchema } from '@/features/auth/types';
import { useRouter } from '@/i18n/routing';
import type { MessageKey } from '@/i18n/types';

import { PasswordStrength } from './password-strength';

const UpdatePasswordForm = () => {
  const t = useTranslations();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<UpdatePasswordSchema>({
    resolver: zodResolver(updatePasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const password = useWatch({
    control: form.control,
    name: 'password',
    defaultValue: '',
  });

  async function onSubmit(data: UpdatePasswordSchema) {
    setIsLoading(true);

    try {
      const result = await updatePassword(data);

      if (result.error) {
        toast.error(t(result.error as MessageKey));
        setIsLoading(false);
      } else {
        toast.success(t('auth.passwordUpdated'));
        router.push(ROUTES.common.dashboard);
        router.refresh();
      }
    } catch {
      toast.error(t('auth.unexpectedError'));
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('auth.newPassword')}</FormLabel>

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
              <FormLabel>{t('auth.confirmPassword')}</FormLabel>

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

        <Button type="submit" className="mt-4 w-full" disabled={isLoading}>
          {isLoading && <Spinner />}
          {t('auth.updatePassword')}
        </Button>
      </form>
    </Form>
  );
};

export { UpdatePasswordForm };
