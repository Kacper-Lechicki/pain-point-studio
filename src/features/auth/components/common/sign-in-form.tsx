'use client';

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
import { PasswordInput } from '@/components/ui/password-input';
import { SubmitButton } from '@/components/ui/submit-button';
import { ROUTES } from '@/config';
import { signInWithEmail } from '@/features/auth/actions';
import { SignInSchema, signInSchema } from '@/features/auth/types';
import { useFormAction } from '@/hooks/common/use-form-action';
import { Link, useRouter } from '@/i18n/routing';

const SignInForm = () => {
  const t = useTranslations();
  const router = useRouter();

  const { isLoading, execute } = useFormAction({
    onSuccess: () => {
      router.push(ROUTES.common.dashboard);
      router.refresh();
    },
  });

  const form = useForm<SignInSchema>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(data: SignInSchema) {
    await execute(signInWithEmail, data);
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
                <Input placeholder={t('auth.emailPlaceholder')} autoComplete="email" {...field} />
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
                <PasswordInput autoComplete="current-password" {...field} />
              </FormControl>

              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex items-center justify-end">
          <Link
            href={ROUTES.auth.forgotPassword}
            className="md:hover:text-primary text-sm underline underline-offset-4"
          >
            {t('auth.forgotPassword')}
          </Link>
        </div>

        <SubmitButton isLoading={isLoading} className="mt-2 w-full font-semibold">
          {t('auth.signInWithEmail')}
        </SubmitButton>
      </form>
    </Form>
  );
};

export { SignInForm };
