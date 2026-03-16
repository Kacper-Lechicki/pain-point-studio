'use client';

import { useEffect, useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { Settings } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';

import { SettingsSectionHeader } from '@/components/shared/settings-section-header';
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
import { SubmitButton } from '@/components/ui/submit-button';
import { Textarea } from '@/components/ui/textarea';
import { updateProject } from '@/features/projects/actions/update-project';
import { ProjectImageUpload } from '@/features/projects/components/project-image-upload';
import {
  PROJECT_NAME_MAX_LENGTH,
  PROJECT_RESPONSE_LIMIT,
  PROJECT_SUMMARY_MAX_LENGTH,
} from '@/features/projects/config';
import { type UpdateProjectInput, updateProjectSchema } from '@/features/projects/types';
import { useFormAction } from '@/hooks/common/use-form-action';
import { useUnsavedChangesWarning } from '@/hooks/unsaved-changes-context';
import type { MessageKey } from '@/i18n/types';

interface ProjectSettingsFormProps {
  project: {
    id: string;
    user_id: string;
    name: string;
    summary: string | null;
    image_url: string | null;
  };
  onSaved?: (data: { name: string; summary: string | undefined; imageUrl?: string | null }) => void;
}

export function ProjectSettingsForm({ project, onSaved }: ProjectSettingsFormProps) {
  const t = useTranslations();
  const [imageUrl, setImageUrl] = useState(project.image_url);

  const { isLoading, execute } = useFormAction({
    successMessage: 'projects.settings.saved' as MessageKey,
    unexpectedErrorMessage: 'projects.errors.unexpected' as MessageKey,
  });

  const form = useForm<UpdateProjectInput>({
    resolver: zodResolver(updateProjectSchema),
    defaultValues: {
      projectId: project.id,
      name: project.name,
      summary: project.summary ?? '',
    },
  });

  useEffect(() => {
    form.reset({
      projectId: project.id,
      name: project.name,
      summary: project.summary ?? '',
    });
  }, [project.id, project.name, project.summary, form]);

  useUnsavedChangesWarning('project-settings-form', form.formState.isDirty);

  const handleImageChange = (url: string | null) => {
    setImageUrl(url);
    onSaved?.({
      name: form.getValues('name'),
      summary: form.getValues('summary'),
      imageUrl: url,
    });
  };

  async function onSubmit(data: UpdateProjectInput) {
    const result = await execute(updateProject, data);

    if (result && !result.error) {
      onSaved?.({
        name: data.name,
        summary: data.summary,
        imageUrl,
      });
    }
  }

  return (
    <section className="space-y-8">
      <SettingsSectionHeader
        icon={Settings}
        title={t('projects.settings.generalTitle')}
        description={t('projects.settings.generalDescription')}
      />

      <div className="space-y-6">
        <ProjectImageUpload
          projectId={project.id}
          userId={project.user_id}
          imageUrl={imageUrl}
          projectName={project.name}
          onImageChange={handleImageChange}
          size={80}
          showButton
        />

        <Form {...form}>
          <form
            id="project-settings-form"
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
          >
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
              name="summary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('projects.create.summaryLabel')}</FormLabel>
                  <FormDescription>{t('projects.create.summaryHelper')}</FormDescription>

                  <FormControl>
                    <Textarea
                      placeholder={t('projects.create.summaryPlaceholder')}
                      className="min-h-[120px] resize-none"
                      rows={5}
                      maxLength={PROJECT_SUMMARY_MAX_LENGTH}
                      {...field}
                    />
                  </FormControl>

                  <div className="flex items-baseline justify-between gap-2">
                    <FormMessage />

                    <span className="text-muted-foreground ml-auto shrink-0 text-xs">
                      {t('projects.create.summaryCounter', {
                        count: (field.value ?? '').length,
                        max: PROJECT_SUMMARY_MAX_LENGTH,
                      })}
                    </span>
                  </div>
                </FormItem>
              )}
            />

            <div className="space-y-1">
              <p className="text-sm font-medium">{t('projects.settings.responseLimit')}</p>
              <p className="text-muted-foreground text-xs">
                {t('projects.settings.responseLimitDescription', {
                  limit: PROJECT_RESPONSE_LIMIT,
                })}
              </p>
            </div>

            <div className="flex justify-end">
              <SubmitButton isLoading={isLoading} form="project-settings-form">
                {t('projects.settings.saveSettings')}
              </SubmitButton>
            </div>
          </form>
        </Form>
      </div>
    </section>
  );
}
