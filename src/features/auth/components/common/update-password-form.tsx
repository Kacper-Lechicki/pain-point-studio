'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useForm, useWatch } from 'react-hook-form';

import { PasswordStrength } from '@/components/shared/password-strength';
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
import { ROUTES } from '@/config';
import { updatePassword } from '@/features/auth/actions';
import { UpdatePasswordSchema, updatePasswordSchema } from '@/features/auth/types';
import { useFormAction } from '@/hooks/common/use-form-action';
import { useRouter } from '@/i18n/routing';
import type { MessageKey } from '@/i18n/types';

const UpdatePasswordForm = () => {
  const t = useTranslations();
  const router = useRouter();

  const { isLoading, execute } = useFormAction({
    successMessage: 'auth.passwordUpdated' as MessageKey,
    onSuccess: () => {
      router.push(ROUTES.common.dashboard);
      router.refresh();
    },
  });

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
    await execute(updatePassword, data);
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
              <FormLabel>{t('auth.confirmPassword')}</FormLabel>

              <FormControl>
                <PasswordInput autoComplete="new-password" {...field} />
              </FormControl>

              <FormMessage />
            </FormItem>
          )}
        />

        <SubmitButton isLoading={isLoading} size="default" className="mt-4 w-full">
          {t('auth.updatePassword')}
        </SubmitButton>
      </form>
    </Form>
  );
};

export { UpdatePasswordForm };
