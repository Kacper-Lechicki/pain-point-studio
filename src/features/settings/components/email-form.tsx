'use client';

import { useTransition } from 'react';

import { useRouter } from 'next/navigation';

import { zodResolver } from '@hookform/resolvers/zod';
import { Info, Mail } from 'lucide-react';
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
import { SubmitButton } from '@/components/ui/submit-button';
import { cancelEmailChange, updateEmail } from '@/features/settings/actions';
import { SettingsSectionHeader } from '@/features/settings/components/settings-section-header';
import { UpdateEmailSchema, updateEmailSchema } from '@/features/settings/types';
import { useFormAction } from '@/hooks/common/use-form-action';
import { useUnsavedChangesWarning } from '@/hooks/unsaved-changes-context';
import type { MessageKey } from '@/i18n/types';

interface EmailFormProps {
  currentEmail: string;
  pendingEmail: string | null;
  emailChangeConfirmStatus: number;
}

const EmailForm = ({ currentEmail, pendingEmail, emailChangeConfirmStatus }: EmailFormProps) => {
  const t = useTranslations();
  const router = useRouter();
  const [isCancelling, startCancelTransition] = useTransition();

  const { isLoading, execute } = useFormAction({
    successMessage: 'settings.email.emailUpdateSent' as MessageKey,
    unexpectedErrorMessage: 'settings.errors.unexpected' as MessageKey,
  });

  const form = useForm<UpdateEmailSchema>({
    resolver: zodResolver(updateEmailSchema),
    defaultValues: {
      email: currentEmail,
    },
  });

  useUnsavedChangesWarning('email-form', form.formState.isDirty);

  async function onSubmit(data: UpdateEmailSchema) {
    await execute(updateEmail, data);
  }

  function handleCancel() {
    startCancelTransition(async () => {
      const result = await cancelEmailChange({});

      if (result.error) {
        toast.error(t(result.error as MessageKey));

        return;
      }

      toast.success(t('settings.email.changeCancelled' as MessageKey));
      router.refresh();
    });
  }

  return (
    <section className="space-y-8">
      <SettingsSectionHeader
        title={t('settings.email.title')}
        description={t('settings.email.description')}
      />

      {pendingEmail && (
        <div className="border-primary/30 bg-primary/5 rounded-lg border px-4 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <Mail className="text-primary size-4 shrink-0" aria-hidden="true" />
                <p className="text-sm font-medium">
                  {t('settings.email.pendingChange', { newEmail: pendingEmail })}
                </p>
              </div>
              <p className="text-muted-foreground text-xs">
                {t('settings.email.confirmationsStatus', {
                  count: emailChangeConfirmStatus,
                })}
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
              disabled={isCancelling}
              className="shrink-0"
            >
              {isCancelling ? <Spinner /> : null}
              {t('settings.email.cancelChange')}
            </Button>
          </div>
        </div>
      )}

      {!pendingEmail && (
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
                      autoComplete="email"
                      {...field}
                    />
                  </FormControl>

                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end">
              <SubmitButton isLoading={isLoading} form="email-form">
                {t('settings.email.saveEmail')}
              </SubmitButton>
            </div>
          </form>
        </Form>
      )}

      <div className="text-muted-foreground flex items-center gap-2 text-xs">
        <Info className="size-4 shrink-0" aria-hidden="true" />
        <p>{t('settings.email.doubleConfirmHint')}</p>
      </div>
    </section>
  );
};

export { EmailForm };
