'use client';

import { useState } from 'react';

import { useRouter } from 'next/navigation';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

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
import { ROUTES } from '@/config/routes';
import { signInWithEmail } from '@/features/auth/actions';
import { SignInSchema, signInSchema } from '@/features/auth/types';
import { Link } from '@/i18n/routing';

export function SignInForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<SignInSchema>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(data: SignInSchema) {
    setIsLoading(true);
    setError(null);

    const result = await signInWithEmail(data);

    if (result.error) {
      setError(result.error);
      setIsLoading(false);
    } else {
      router.push(ROUTES.common.dashboard);
      router.refresh();
    }
  }

  return (
    <div className="grid gap-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>

                <FormControl>
                  <Input placeholder="name@example.com" {...field} />
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
                <FormLabel>Password</FormLabel>

                <FormControl>
                  <Input type="password" placeholder="••••••••" {...field} />
                </FormControl>

                <FormMessage />
              </FormItem>
            )}
          />

          {error && <div className="text-destructive text-sm font-medium">{error}</div>}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && (
              <div className="border-background border-t-foreground mr-2 size-4 animate-spin rounded-full border-2" />
            )}
            Sign In with Email
          </Button>
        </form>
      </Form>

      <div className="text-center text-sm">
        <Link
          href={ROUTES.auth.forgotPassword || '/forgot-password'}
          className="text-muted-foreground hover:text-primary underline-offset-4 hover:underline"
        >
          Forgot your password?
        </Link>
      </div>
    </div>
  );
}
