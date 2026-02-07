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
import { InfoHint } from '@/components/ui/info-hint';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { updateEmail } from '@/features/settings/actions';
import { UpdateEmailSchema, updateEmailSchema } from '@/features/settings/types';

interface EmailFormProps {
  currentEmail: string;
}

const EmailForm = ({ currentEmail }: EmailFormProps) => {
  const t = useTranslations();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<UpdateEmailSchema>({
    resolver: zodResolver(updateEmailSchema),
    defaultValues: {
      email: currentEmail,
    },
  });

  async function onSubmit(data: UpdateEmailSchema) {
    setIsLoading(true);

    try {
      const result = await updateEmail(data);

      if (result.error) {
        toast.error(t(result.error));
      } else {
        toast.success(t('settings.email.emailUpdateSent'));
      }
    } catch {
      toast.error(t('settings.errors.unexpected'));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">{t('settings.email.title')}</h2>

          <InfoHint
            content={t('settings.email.doubleConfirmHint')}
            dialogTitle={t('settings.email.title')}
          />
        </div>

        <p className="text-muted-foreground text-sm">{t('settings.email.description')}</p>
      </div>

      <Form {...form}>
        <form id="email-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('settings.email.newEmail')}</FormLabel>

                <FormControl>
                  <Input
                    type="email"
                    placeholder={t('settings.email.newEmailPlaceholder')}
                    {...field}
                  />
                </FormControl>

                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end">
            <Button type="submit" form="email-form" disabled={isLoading}>
              {isLoading && <Spinner />}
              {t('settings.email.saveEmail')}
            </Button>
          </div>
        </form>
      </Form>
    </section>
  );
};

export { EmailForm };
