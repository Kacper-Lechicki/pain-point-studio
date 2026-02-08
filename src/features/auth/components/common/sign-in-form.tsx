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
import { PasswordInput } from '@/components/ui/password-input';
import { Spinner } from '@/components/ui/spinner';
import { ROUTES } from '@/config';
import { signInWithEmail } from '@/features/auth/actions';
import { SignInSchema, signInSchema } from '@/features/auth/types';
import { Link, useRouter } from '@/i18n/routing';
import type { MessageKey } from '@/i18n/types';

const SignInForm = () => {
  const t = useTranslations();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<SignInSchema>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(data: SignInSchema) {
    setIsLoading(true);

    try {
      const result = await signInWithEmail(data);

      if (result.error) {
        toast.error(t(result.error as MessageKey));
        setIsLoading(false);
      } else {
        toast.success(t('auth.signInSuccess'));
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

        <div className="flex items-center justify-end">
          <Link
            href={ROUTES.auth.forgotPassword}
            className="hover:text-primary text-sm underline underline-offset-4"
          >
            {t('auth.forgotPassword')}
          </Link>
        </div>

        <Button type="submit" size="lg" className="mt-2 w-full font-semibold" disabled={isLoading}>
          {isLoading && <Spinner />}
          {t('auth.signInWithEmail')}
        </Button>
      </form>
    </Form>
  );
};

export { SignInForm };
