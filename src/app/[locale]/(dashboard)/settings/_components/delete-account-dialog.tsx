'use client';

import { useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';

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
import { Spinner } from '@/components/ui/spinner';
import { ROUTES } from '@/config';
import { deleteAccount } from '@/features/settings/actions';
import {
  DELETE_CONFIRMATION_TEXT,
  DeleteAccountSchema,
  deleteAccountSchema,
} from '@/features/settings/types';
import { useRouter } from '@/i18n/routing';

interface DeleteAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DeleteAccountDialog = ({ open, onOpenChange }: DeleteAccountDialogProps) => {
  const t = useTranslations();
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

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

  const isConfirmed = confirmationValue === DELETE_CONFIRMATION_TEXT;

  async function onSubmit(data: DeleteAccountSchema) {
    setIsDeleting(true);

    try {
      const result = await deleteAccount(data);

      if (result.error) {
        toast.error(t(result.error));
        setIsDeleting(false);
      } else {
        toast.success(t('settings.dangerZone.accountDeleted'));
        router.push(ROUTES.common.home);
        router.refresh();
      }
    } catch {
      toast.error(t('settings.errors.unexpected'));
      setIsDeleting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('settings.dangerZone.deleteConfirmTitle')}</DialogTitle>

          <DialogDescription>{t('settings.dangerZone.deleteConfirmDescription')}</DialogDescription>
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
                      text: DELETE_CONFIRMATION_TEXT,
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
                onClick={() => onOpenChange(false)}
                disabled={isDeleting}
              >
                {t('common.cancel')}
              </Button>

              <Button type="submit" variant="destructive" disabled={!isConfirmed || isDeleting}>
                {isDeleting && <Spinner />}
                {t('settings.dangerZone.deleteButton')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export { DeleteAccountDialog };
