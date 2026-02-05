'use client';

import { useState } from 'react';

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
import { ROUTES } from '@/config/routes';
import { resetPassword } from '@/features/auth/actions';
import { ForgotPasswordSchema, forgotPasswordSchema } from '@/features/auth/types';
import { Link } from '@/i18n/routing';

export function ForgotPasswordForm() {
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

    const result = await resetPassword(data);

    if (result.error) {
      toast.error(result.error);
      setIsLoading(false);
    } else {
      toast.success(t('auth.resetLinkSent'));
      setSuccess(true);
      setIsLoading(false);
    }
  }

  if (success) {
    return (
      <div className="flex flex-col space-y-4 text-center">
        <h3 className="text-lg font-semibold">{t('auth.checkEmail')}</h3>

        <p className="text-muted-foreground text-sm">{t('auth.resetLinkSent')}</p>

        <Link href={ROUTES.auth.signIn}>
          <Button variant="outline" className="w-full">
            {t('auth.backToSignIn')}
          </Button>
        </Link>
      </div>
    );
  }

  return (
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

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Spinner />}
          {t('auth.sendResetLink')}
        </Button>

        <div className="text-center text-sm">
          <Link
            href={ROUTES.auth.signIn}
            className="text-muted-foreground hover:text-primary underline-offset-4 hover:underline"
          >
            {t('auth.backToSignIn')}
          </Link>
        </div>
      </form>
    </Form>
  );
}
