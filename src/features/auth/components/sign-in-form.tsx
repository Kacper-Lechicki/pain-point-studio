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
import { signInWithEmail } from '@/features/auth/actions';
import { SignInSchema, signInSchema } from '@/features/auth/types';
import { Link, useRouter } from '@/i18n/routing';

export function SignInForm() {
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

    const result = await signInWithEmail(data);

    if (result.error) {
      toast.error(result.error);
      setIsLoading(false);
    } else {
      toast.success(t('auth.signInSuccess'));
      router.push(ROUTES.common.dashboard);
      router.refresh();
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
                <Input type="password" placeholder={t('auth.passwordPlaceholder')} {...field} />
              </FormControl>

              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Spinner />}
          {t('auth.signInWithEmail')}
        </Button>

        <div className="text-center text-sm">
          <Link
            href={ROUTES.auth.forgotPassword}
            className="text-muted-foreground hover:text-primary underline-offset-4 hover:underline"
          >
            {t('auth.forgotPassword')}
          </Link>
        </div>
      </form>
    </Form>
  );
}
