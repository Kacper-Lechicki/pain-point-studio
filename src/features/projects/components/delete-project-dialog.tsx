'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';

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
import { permanentDeleteProjectForce } from '@/features/projects/actions/permanent-delete-project-force';
import { useFormAction } from '@/hooks/common/use-form-action';
import { useRouter } from '@/i18n/routing';
import type { MessageKey } from '@/i18n/types';

const confirmationSchema = z.object({
  confirmation: z.string().trim().min(1),
});

type ConfirmationForm = z.infer<typeof confirmationSchema>;

interface DeleteProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  projectName: string;
}

export function DeleteProjectDialog({
  open,
  onOpenChange,
  projectId,
  projectName,
}: DeleteProjectDialogProps) {
  const t = useTranslations();
  const router = useRouter();

  const { isLoading: isDeleting, execute } = useFormAction({
    successMessage: 'projects.settings.dangerZone.deleted' as MessageKey,
    unexpectedErrorMessage: 'projects.errors.unexpected' as MessageKey,
    onSuccess: () => {
      router.push(ROUTES.dashboard.projects);
      router.refresh();
    },
  });

  const form = useForm<ConfirmationForm>({
    resolver: zodResolver(confirmationSchema),
    defaultValues: {
      confirmation: '',
    },
  });

  const confirmationValue = useWatch({
    control: form.control,
    name: 'confirmation',
    defaultValue: '',
  });

  const isConfirmed = confirmationValue === projectName;

  async function onSubmit() {
    await execute(permanentDeleteProjectForce, {
      projectId,
      confirmation: confirmationValue,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('projects.settings.dangerZone.deleteConfirmTitle')}</DialogTitle>

          <DialogDescription>
            {t('projects.settings.dangerZone.deleteConfirmDescription')}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="confirmation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t('projects.settings.dangerZone.deleteConfirmLabel', {
                      name: projectName,
                    })}
                  </FormLabel>

                  <FormControl>
                    <Input
                      placeholder={t('projects.settings.dangerZone.deleteConfirmPlaceholder')}
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

              <SubmitButton isLoading={isDeleting} variant="destructive" disabled={!isConfirmed}>
                {t('projects.settings.dangerZone.deleteButton')}
              </SubmitButton>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
