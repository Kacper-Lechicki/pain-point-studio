'use client';

import { useRouter } from 'next/navigation';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { Spinner } from '@/components/ui/spinner';
import { createProject } from '@/features/projects/actions/create-project';
import { ProjectFormFields } from '@/features/projects/components/project-form-fields';
import { getProjectDetailUrl } from '@/features/projects/lib/project-urls';
import { type CreateProjectInput, createProjectSchema } from '@/features/projects/types';
import { useFormAction } from '@/hooks/common/use-form-action';
import { useUnsavedChangesWarning } from '@/hooks/unsaved-changes-context';
import type { MessageKey } from '@/i18n/types';

export function CreateProjectForm() {
  const t = useTranslations();
  const router = useRouter();

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

  const hasDirtyFields = Object.keys(form.formState.dirtyFields).length > 0;

  useUnsavedChangesWarning('create-project-form', hasDirtyFields);

  async function onSubmit(data: CreateProjectInput) {
    const result = await action.execute(createProject, data);

    if (result?.data?.projectId) {
      router.push(getProjectDetailUrl(result.data.projectId));
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <ProjectFormFields form={form} />

        <div className="flex items-center justify-end pt-2">
          <Button type="submit" disabled={action.isLoading}>
            {action.isLoading && <Spinner />}
            {t('projects.create.submit')}
          </Button>
        </div>
      </form>
    </Form>
  );
}
