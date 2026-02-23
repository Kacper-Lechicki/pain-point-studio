'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Form } from '@/components/ui/form';
import { Spinner } from '@/components/ui/spinner';
import { createProject } from '@/features/projects/actions/create-project';
import { ProjectFormFields } from '@/features/projects/components/project-form-fields';
import { type CreateProjectInput, createProjectSchema } from '@/features/projects/types';
import { useFormAction } from '@/hooks/common/use-form-action';
import type { MessageKey } from '@/i18n/types';

interface CreateProjectInlineDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (project: { id: string; name: string; context: string }) => void;
}

export function CreateProjectInlineDialog({
  open,
  onOpenChange,
  onCreated,
}: CreateProjectInlineDialogProps) {
  const t = useTranslations();

  const action = useFormAction<{ projectId: string }>({
    successMessage: 'projects.create.success' as MessageKey,
    unexpectedErrorMessage: 'projects.errors.unexpected' as MessageKey,
  });

  const form = useForm<CreateProjectInput>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  });

  async function onSubmit(data: CreateProjectInput) {
    const result = await action.execute(createProject, data);

    if (result?.data?.projectId) {
      onCreated({
        id: result.data.projectId,
        name: data.name,
        context: data.context,
      });
      onOpenChange(false);
      form.reset();
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('projects.create.title')}</DialogTitle>
          <DialogDescription>{t('projects.create.pageDescription')}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <ProjectFormFields form={form} />

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  {t('common.cancel')}
                </Button>
              </DialogClose>

              <Button type="submit" disabled={action.isLoading}>
                {action.isLoading && <Spinner />}
                {t('projects.create.submit')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
