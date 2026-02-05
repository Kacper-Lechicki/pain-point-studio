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
import { updatePassword } from '@/features/auth/actions';
import { UpdatePasswordSchema, updatePasswordSchema } from '@/features/auth/types';

export function UpdatePasswordForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<UpdatePasswordSchema>({
    resolver: zodResolver(updatePasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  async function onSubmit(data: UpdatePasswordSchema) {
    setIsLoading(true);
    setError(null);

    const result = await updatePassword(data);

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
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>New Password</FormLabel>

                <FormControl>
                  <Input type="password" placeholder="••••••••" {...field} />
                </FormControl>

                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm Password</FormLabel>

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
            Update Password
          </Button>
        </form>
      </Form>
    </div>
  );
}
