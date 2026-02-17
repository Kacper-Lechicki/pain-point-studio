'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useForm, useWatch } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { SubmitButton } from '@/components/ui/submit-button';
import { ROUTES } from '@/config';
import { deleteAccount } from '@/features/settings/actions';
import { DeleteAccountSchema, deleteAccountSchema } from '@/features/settings/types';
import { useFormAction } from '@/hooks/common/use-form-action';
import { useRouter } from '@/i18n/routing';
import type { MessageKey } from '@/i18n/types';

interface DeleteAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userEmail: string;
  activeSurveyCount: number;
  responseCount: number;
}

const DeleteAccountDialog = ({
  open,
  onOpenChange,
  userEmail,
  activeSurveyCount,
  responseCount,
}: DeleteAccountDialogProps) => {
  const t = useTranslations();
  const router = useRouter();

  const { isLoading: isDeleting, execute } = useFormAction({
    successMessage: 'settings.dangerZone.accountDeleted' as MessageKey,
    unexpectedErrorMessage: 'settings.errors.unexpected' as MessageKey,
    onSuccess: () => {
      router.push(ROUTES.common.home);
      router.refresh();
    },
  });

  const form = useForm<DeleteAccountSchema>({
    resolver: zodResolver(deleteAccountSchema),
    defaultValues: {
      confirmation: '',
    },
  });

  const confirmationValue = useWatch({
    control: form.control,
    name: 'confirmation',
    defaultValue: '',
  });

  const isConfirmed = confirmationValue === userEmail;

  async function onSubmit(data: DeleteAccountSchema) {
    await execute(deleteAccount, data);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('settings.dangerZone.deleteConfirmTitle')}</DialogTitle>

          <DialogDescription>{t('settings.dangerZone.deleteConfirmDescription')}</DialogDescription>

          {activeSurveyCount > 0 && (
            <p className="text-destructive text-sm font-medium">
              {t('settings.dangerZone.deleteDataWarning', {
                surveyCount: activeSurveyCount,
                responseCount,
              })}
            </p>
          )}
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="confirmation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t('settings.dangerZone.deleteConfirmLabel', {
                      text: userEmail,
                    })}
                  </FormLabel>

                  <FormControl>
                    <Input
                      placeholder={t('settings.dangerZone.deleteConfirmPlaceholder')}
                      autoComplete="off"
                      {...field}
                    />
                  </FormControl>

                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                data-testid="delete-cancel"
                onClick={() => onOpenChange(false)}
                disabled={isDeleting}
              >
                {t('common.cancel')}
              </Button>

              <SubmitButton isLoading={isDeleting} variant="destructive" disabled={!isConfirmed}>
                {t('settings.dangerZone.deleteButton')}
              </SubmitButton>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export { DeleteAccountDialog };
