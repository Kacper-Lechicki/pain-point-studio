'use client';

import { ReactNode, useState } from 'react';

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
import { ROUTES } from '@/config';
import { resetPassword } from '@/features/auth/actions';
import { AuthSuccessMessage } from '@/features/auth/components/common/auth-success-message';
import { ForgotPasswordSchema, forgotPasswordSchema } from '@/features/auth/types';
import { useFormAction } from '@/hooks/common/use-form-action';
import { Link } from '@/i18n/routing';
import type { MessageKey } from '@/i18n/types';

interface ForgotPasswordFormProps {
  header?: ReactNode;
}

const ForgotPasswordForm = ({ header }: ForgotPasswordFormProps) => {
  const t = useTranslations();
  const [success, setSuccess] = useState(false);

  const { isLoading, execute } = useFormAction({
    successMessage: 'auth.resetLinkSent' as MessageKey,
    onSuccess: () => setSuccess(true),
  });

  const form = useForm<ForgotPasswordSchema>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  async function onSubmit(data: ForgotPasswordSchema) {
    await execute(resetPassword, data);
  }

  if (success) {
    return <AuthSuccessMessage messageKey={'auth.resetLinkSent' as MessageKey} />;
  }

  return (
    <>
      {header}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('auth.email')}</FormLabel>

                <FormControl>
                  <Input placeholder={t('auth.emailPlaceholder')} {...field} />
                </FormControl>

                <FormMessage />
              </FormItem>
            )}
          />

          <SubmitButton isLoading={isLoading} size="default" className="mt-4 w-full">
            {t('auth.sendResetLink')}
          </SubmitButton>

          <div className="mt-2 text-center text-sm">
            <Link
              href={ROUTES.auth.signIn}
              className="md:hover:text-primary underline underline-offset-4"
            >
              {t('auth.backToSignIn')}
            </Link>
          </div>
        </form>
      </Form>
    </>
  );
};

export { ForgotPasswordForm };
