'use client';

import { ReactNode, useState } from 'react';

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
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { SubmitButton } from '@/components/ui/submit-button';
import { signUpWithEmail } from '@/features/auth/actions';
import { AuthSuccessMessage } from '@/features/auth/components/common/auth-success-message';
import { SignUpSchema, signUpSchema } from '@/features/auth/types';
import { useFormAction } from '@/hooks/common/use-form-action';
import type { MessageKey } from '@/i18n/types';

interface SignUpFormProps {
  header?: ReactNode;
  children?: ReactNode;
}

const SignUpForm = ({ header, children }: SignUpFormProps) => {
  const t = useTranslations();
  const [success, setSuccess] = useState(false);

  const form = useForm<SignUpSchema>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const { isLoading, execute } = useFormAction({
    successMessage: 'auth.confirmationSent' as MessageKey,
    onSuccess: () => {
      setSuccess(true);
      form.reset();
    },
  });

  const password = useWatch({
    control: form.control,
    name: 'password',
    defaultValue: '',
  });

  async function onSubmit(data: SignUpSchema) {
    await execute(signUpWithEmail, data);
  }

  if (success) {
    return <AuthSuccessMessage messageKey={'auth.confirmationSent' as MessageKey} />;
  }

  return (
    <>
      {header}

      <div className="grid gap-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('auth.email')}</FormLabel>

                  <FormControl>
                    <Input
                      placeholder={t('auth.emailPlaceholder')}
                      autoComplete="email"
                      {...field}
                    />
                  </FormControl>

                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('auth.password')}</FormLabel>

                  <FormControl>
                    <PasswordInput autoComplete="new-password" {...field} />
                  </FormControl>

                  <PasswordStrength
                    password={password}
                    isError={!!form.formState.errors.password}
                  />
                </FormItem>
              )}
            />

            <SubmitButton isLoading={isLoading} className="mt-4 w-full font-semibold">
              {t('auth.createAccount')}
            </SubmitButton>
          </form>
        </Form>

        {children}
      </div>
    </>
  );
};

export { SignUpForm };
