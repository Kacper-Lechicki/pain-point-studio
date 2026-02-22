'use client';

import { useEffect } from 'react';

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
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import type { ProjectWithMetrics } from '@/features/projects/actions/get-projects';
import { updateProject } from '@/features/projects/actions/update-project';
import {
  PROJECT_DESCRIPTION_MAX_LENGTH,
  PROJECT_NAME_MAX_LENGTH,
} from '@/features/projects/config';
import { type UpdateProjectInput, updateProjectSchema } from '@/features/projects/types';
import { useFormAction } from '@/hooks/common/use-form-action';
import type { MessageKey } from '@/i18n/types';

interface EditProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: ProjectWithMetrics;
  onSuccess: (data: { name: string; description: string | undefined }) => void;
}

export function EditProjectDialog({
  open,
  onOpenChange,
  project,
  onSuccess,
}: EditProjectDialogProps) {
  const t = useTranslations();

  const action = useFormAction({
    successMessage: 'projects.list.edit.success' as MessageKey,
    unexpectedErrorMessage: 'projects.errors.unexpected' as MessageKey,
  });

  const form = useForm<UpdateProjectInput>({
    resolver: zodResolver(updateProjectSchema),
    defaultValues: {
      projectId: project.id,
      name: project.name,
      description: project.description ?? '',
    },
  });

  useEffect(() => {
    form.reset({
      projectId: project.id,
      name: project.name,
      description: project.description ?? '',
    });
  }, [project, form]);

  async function onSubmit(data: UpdateProjectInput) {
    const result = await action.execute(updateProject, data);

    if (result && !result.error) {
      onSuccess({ name: data.name, description: data.description });
      onOpenChange(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('projects.list.edit.title')}</DialogTitle>
          <DialogDescription>{t('projects.list.edit.description')}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('projects.create.name')}</FormLabel>

                  <FormControl>
                    <Input
                      placeholder={t('projects.create.namePlaceholder')}
                      maxLength={PROJECT_NAME_MAX_LENGTH}
                      {...field}
                    />
                  </FormControl>

                  <div className="flex items-baseline justify-between gap-2">
                    <FormMessage />

                    <span className="text-muted-foreground ml-auto shrink-0 text-xs">
                      {t('projects.create.nameCounter', {
                        count: (field.value ?? '').length,
                        max: PROJECT_NAME_MAX_LENGTH,
                      })}
                    </span>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('projects.create.descriptionLabel')}</FormLabel>
                  <FormDescription>{t('projects.create.descriptionHelper')}</FormDescription>

                  <FormControl>
                    <Textarea
                      placeholder={t('projects.create.descriptionPlaceholder')}
                      className="min-h-[120px] resize-none"
                      rows={5}
                      maxLength={PROJECT_DESCRIPTION_MAX_LENGTH}
                      {...field}
                    />
                  </FormControl>

                  <div className="flex items-baseline justify-between gap-2">
                    <FormMessage />

                    <span className="text-muted-foreground ml-auto shrink-0 text-xs">
                      {t('projects.create.descriptionCounter', {
                        count: (field.value ?? '').length,
                        max: PROJECT_DESCRIPTION_MAX_LENGTH,
                      })}
                    </span>
                  </div>
                </FormItem>
              )}
            />

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  {t('common.cancel')}
                </Button>
              </DialogClose>

              <Button type="submit" disabled={action.isLoading}>
                {action.isLoading && <Spinner />}
                {t('projects.list.edit.submit')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
