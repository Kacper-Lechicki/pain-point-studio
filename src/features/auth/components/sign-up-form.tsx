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
import { signUpWithEmail } from '@/features/auth/actions';
import { SignUpSchema, signUpSchema } from '@/features/auth/types';
import { Link } from '@/i18n/routing';

export function SignUpForm() {
  const t = useTranslations();
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const form = useForm<SignUpSchema>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(data: SignUpSchema) {
    setIsLoading(true);

    const result = await signUpWithEmail(data);

    if (result.error) {
      toast.error(result.error);
      setIsLoading(false);
    } else {
      toast.success(t('auth.confirmationSent'));
      setSuccess(true);
      setIsLoading(false);

      form.reset();
    }
  }

  if (success) {
    return (
      <div className="flex flex-col space-y-4 text-center">
        <h3 className="text-lg font-semibold">{t('auth.checkEmail')}</h3>

        <p className="text-muted-foreground text-sm">{t('auth.confirmationSent')}</p>

        <Button variant="outline" className="w-full" onClick={() => setSuccess(false)}>
          {t('auth.backToSignUp')}
        </Button>
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

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('auth.password')}</FormLabel>

              <FormControl>
                <Input type="password" placeholder={t('auth.passwordPlaceholder')} {...field} />
              </FormControl>

              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Spinner />}
          {t('auth.createAccount')}
        </Button>

        <div className="text-center text-sm">
          {t('auth.alreadyHaveAccount')}{' '}
          <Link
            href={ROUTES.auth.signIn}
            className="text-primary underline-offset-4 hover:underline"
          >
            {t('auth.signIn')}
          </Link>
        </div>
      </form>
    </Form>
  );
}
