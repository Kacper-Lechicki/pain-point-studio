'use client';

import { ReactNode, useState } from 'react';

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
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Spinner } from '@/components/ui/spinner';
import { ROUTES } from '@/config';
import { signUpWithEmail } from '@/features/auth/actions';
import { PasswordStrength } from '@/features/auth/components/common/password-strength';
import { SignUpSchema, signUpSchema } from '@/features/auth/types';
import { Link } from '@/i18n/routing';
import type { MessageKey } from '@/i18n/types';

interface SignUpFormProps {
  header?: ReactNode;
  children?: ReactNode;
}

const SignUpForm = ({ header, children }: SignUpFormProps) => {
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

  const password = useWatch({
    control: form.control,
    name: 'password',
    defaultValue: '',
  });

  async function onSubmit(data: SignUpSchema) {
    setIsLoading(true);

    try {
      const result = await signUpWithEmail(data);

      if (result.error) {
        toast.error(t(result.error as MessageKey));
        setIsLoading(false);
      } else {
        toast.success(t('auth.confirmationSent'));
        setSuccess(true);
        setIsLoading(false);

        form.reset();
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

        <p className="text-muted-foreground text-sm">{t('auth.confirmationSent')}</p>

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

                  <PasswordStrength
                    password={password}
                    isError={!!form.formState.errors.password}
                  />
                </FormItem>
              )}
            />

            <Button type="submit" className="mt-4 w-full font-semibold" disabled={isLoading}>
              {isLoading && <Spinner />}
              {t('auth.createAccount')}
            </Button>
          </form>
        </Form>

        {children}
      </div>
    </>
  );
};

export { SignUpForm };
