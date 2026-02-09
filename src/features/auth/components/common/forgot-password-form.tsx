'use client';

import { ReactNode, useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
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
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { ROUTES } from '@/config';
import { resetPassword } from '@/features/auth/actions';
import { ForgotPasswordSchema, forgotPasswordSchema } from '@/features/auth/types';
import { Link } from '@/i18n/routing';
import type { MessageKey } from '@/i18n/types';

interface ForgotPasswordFormProps {
  header?: ReactNode;
}

const ForgotPasswordForm = ({ header }: ForgotPasswordFormProps) => {
  const t = useTranslations();
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const form = useForm<ForgotPasswordSchema>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  async function onSubmit(data: ForgotPasswordSchema) {
    setIsLoading(true);

    try {
      const result = await resetPassword(data);

      if (result.error) {
        toast.error(t(result.error as MessageKey));
        setIsLoading(false);
      } else {
        toast.success(t('auth.resetLinkSent'));
        setSuccess(true);
        setIsLoading(false);
      }
    } catch {
      toast.error(t('auth.unexpectedError'));
      setIsLoading(false);
    }
  }

  if (success) {
    return (
      <div className="flex flex-col space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">{t('auth.checkEmail')}</h1>

        <p className="text-muted-foreground text-sm">{t('auth.resetLinkSent')}</p>

        <div className="pt-2">
          <Link href={ROUTES.auth.signIn}>
            <Button variant="outline" className="w-full">
              {t('auth.backToSignIn')}
            </Button>
          </Link>
        </div>
      </div>
    );
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

          <Button type="submit" size="lg" className="mt-4 w-full" disabled={isLoading}>
            {isLoading && <Spinner />}
            {t('auth.sendResetLink')}
          </Button>

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
