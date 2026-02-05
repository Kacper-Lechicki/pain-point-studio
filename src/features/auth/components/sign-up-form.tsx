'use client';

import { useState } from 'react';

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
import { signUpWithEmail } from '@/features/auth/actions';
import { SignUpSchema, signUpSchema } from '@/features/auth/types';
import { Link } from '@/i18n/routing';

export function SignUpForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
    setError(null);
    setSuccess(false);

    const result = await signUpWithEmail(data);

    if (result.error) {
      setError(result.error);
      setIsLoading(false);
    } else {
      setSuccess(true);
      setIsLoading(false);

      form.reset();
    }
  }

  if (success) {
    return (
      <div className="flex flex-col space-y-4 text-center">
        <h3 className="text-lg font-semibold">Check your email</h3>

        <p className="text-muted-foreground text-sm">
          We&apos;ve sent you a confirmation link. Please check your inbox to complete your
          registration.
        </p>

        <Button variant="outline" className="w-full" onClick={() => setSuccess(false)}>
          Back to Sign Up
        </Button>
      </div>
    );
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
            Create Account
          </Button>
        </form>
      </Form>

      <div className="text-center text-sm">
        Already have an account?{' '}
        <Link href={ROUTES.auth.signIn} className="text-primary underline-offset-4 hover:underline">
          Sign In
        </Link>
      </div>
    </div>
  );
}
