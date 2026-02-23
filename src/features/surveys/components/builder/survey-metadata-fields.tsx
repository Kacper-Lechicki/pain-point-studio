'use client';

import { useCallback, useState } from 'react';

import { useTranslations } from 'next-intl';
import type { UseFormReturn } from 'react-hook-form';

import { Combobox } from '@/components/ui/combobox';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { ROUTES } from '@/config/routes';
import { CreateProjectInlineDialog } from '@/features/projects/components/create-project-inline-dialog';
import { RESEARCH_PHASE_CONFIG } from '@/features/projects/config/contexts';
import { RESEARCH_PHASES, type ResearchPhase } from '@/features/projects/types';
import type { ProjectOption, SurveyCategoryOption } from '@/features/surveys/actions';
import { SURVEY_DESCRIPTION_MAX_LENGTH, SURVEY_TITLE_MAX_LENGTH } from '@/features/surveys/config';
import type { SurveyMetadataSchema } from '@/features/surveys/types';
import { Link } from '@/i18n/routing';
import type { MessageKey } from '@/i18n/types';

/** Sentinel value for "no project" in combobox. */
const NO_PROJECT_VALUE = '__none__';

interface SurveyMetadataFieldsProps {
  form: UseFormReturn<SurveyMetadataSchema>;
  categoryOptions: SurveyCategoryOption[];
  projectOptions: ProjectOption[];
}

export function SurveyMetadataFields({
  form,
  categoryOptions,
  projectOptions,
}: SurveyMetadataFieldsProps) {
  const t = useTranslations();
  const [localProjectOptions, setLocalProjectOptions] = useState<ProjectOption[]>(projectOptions);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const selectedProjectId = form.watch('projectId');
  const selectedProject = localProjectOptions.find((p) => p.value === selectedProjectId);
  const showPhaseSelect = selectedProject?.context === 'idea_validation';

  const comboboxOptions = [
    { value: NO_PROJECT_VALUE, label: t('surveys.create.noProject') },
    ...localProjectOptions.map((p) => ({ value: p.value, label: p.label })),
  ];

  const handleProjectChange = useCallback(
    (value: string) => {
      if (value === NO_PROJECT_VALUE) {
        form.setValue('projectId', null, { shouldDirty: true });
        form.setValue('researchPhase', null, { shouldDirty: true });

        return;
      }

      form.setValue('projectId', value, { shouldDirty: true });

      const project = localProjectOptions.find((p) => p.value === value);

      if (project?.context !== 'idea_validation') {
        form.setValue('researchPhase', null, { shouldDirty: true });
      }
    },
    [form, localProjectOptions]
  );

  const handleProjectCreated = useCallback(
    (project: { id: string; name: string; context: string }) => {
      setLocalProjectOptions((prev) => [
        ...prev,
        { value: project.id, label: project.name, context: project.context },
      ]);
      form.setValue('projectId', project.id, { shouldDirty: true });

      if (project.context !== 'idea_validation') {
        form.setValue('researchPhase', null, { shouldDirty: true });
      }
    },
    [form]
  );

  return (
    <>
      <FormField
        control={form.control}
        name="title"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('surveys.create.surveyTitle')}</FormLabel>

            <FormControl>
              <Input
                placeholder={t('surveys.create.surveyTitlePlaceholder')}
                maxLength={SURVEY_TITLE_MAX_LENGTH}
                {...field}
              />
            </FormControl>

            <div className="flex items-baseline justify-between gap-2">
              <FormMessage />

              <span className="text-muted-foreground ml-auto shrink-0 text-xs">
                {t('surveys.create.titleCounter', {
                  count: (field.value ?? '').length,
                  max: SURVEY_TITLE_MAX_LENGTH,
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
            <FormLabel>{t('surveys.create.surveyDescription')}</FormLabel>
            <FormDescription>{t('surveys.create.surveyDescriptionHelper')}</FormDescription>

            <FormControl>
              <Textarea
                placeholder={t('surveys.create.surveyDescriptionPlaceholder')}
                className="min-h-[120px] resize-none"
                rows={5}
                maxLength={SURVEY_DESCRIPTION_MAX_LENGTH}
                {...field}
              />
            </FormControl>

            <div className="flex items-baseline justify-between gap-2">
              <FormMessage />

              <span className="text-muted-foreground ml-auto shrink-0 text-xs">
                {t('surveys.create.descriptionCounter', {
                  count: (field.value ?? '').length,
                  max: SURVEY_DESCRIPTION_MAX_LENGTH,
                })}
              </span>
            </div>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="category"
        render={({ field, fieldState }) => (
          <FormItem>
            <FormLabel>{t('surveys.create.category')}</FormLabel>

            <FormDescription>
              {t.rich('surveys.create.categoryHelper', {
                link: (chunks) => (
                  <Link
                    href={ROUTES.dashboard.analyticsProjectIdea}
                    className="text-foreground underline underline-offset-2"
                  >
                    {chunks}
                  </Link>
                ),
              })}
            </FormDescription>

            <FormControl>
              <Combobox
                options={categoryOptions}
                value={field.value}
                onValueChange={field.onChange}
                placeholder={t('surveys.create.categoryPlaceholder')}
                searchPlaceholder={t('common.search')}
                emptyMessage={t('common.noResults')}
                aria-label={t('surveys.create.category')}
                aria-invalid={!!fieldState.error}
              />
            </FormControl>

            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="visibility"
        render={({ field }) => (
          <FormItem className="flex items-start justify-between gap-4 rounded-lg border p-3 sm:p-4">
            <div className="min-w-0 space-y-0.5">
              <FormLabel>{t('surveys.create.visibility')}</FormLabel>

              <FormDescription>
                {field.value === 'public'
                  ? t('surveys.create.visibilityPublicDescription')
                  : t('surveys.create.visibilityPrivateDescription')}
              </FormDescription>
            </div>

            <FormControl>
              <Switch
                checked={field.value === 'public'}
                onCheckedChange={(checked) => field.onChange(checked ? 'public' : 'private')}
                disabled
              />
            </FormControl>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="projectId"
        render={({ fieldState }) => (
          <FormItem>
            <FormLabel>{t('surveys.create.project')}</FormLabel>
            <FormDescription>{t('surveys.create.projectHelper')}</FormDescription>

            <FormControl>
              <Combobox
                options={comboboxOptions}
                value={selectedProjectId ?? NO_PROJECT_VALUE}
                onValueChange={handleProjectChange}
                placeholder={t('surveys.create.projectPlaceholder')}
                searchPlaceholder={t('common.search')}
                emptyMessage={t('common.noResults')}
                aria-label={t('surveys.create.project')}
                aria-invalid={!!fieldState.error}
              />
            </FormControl>

            <button
              type="button"
              onClick={() => setCreateDialogOpen(true)}
              className="text-muted-foreground hover:text-foreground text-sm underline underline-offset-2 transition-colors"
            >
              {t('surveys.create.newProject')}
            </button>

            <FormMessage />
          </FormItem>
        )}
      />

      {showPhaseSelect && (
        <FormField
          control={form.control}
          name="researchPhase"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel>{t('surveys.create.researchPhase')}</FormLabel>
              <FormDescription>{t('surveys.create.researchPhaseHelper')}</FormDescription>

              <FormControl>
                <Select
                  value={field.value ?? ''}
                  onValueChange={(val) => field.onChange(val || null)}
                >
                  <SelectTrigger className="w-full" aria-invalid={!!fieldState.error}>
                    <SelectValue placeholder={t('surveys.create.researchPhasePlaceholder')} />
                  </SelectTrigger>

                  <SelectContent>
                    {RESEARCH_PHASES.map((phase) => {
                      const config = RESEARCH_PHASE_CONFIG[phase as ResearchPhase];
                      const Icon = config.icon;

                      return (
                        <SelectItem key={phase} value={phase}>
                          <span className="flex items-center gap-2">
                            <Icon className="size-4 shrink-0" aria-hidden />
                            {t(config.labelKey as MessageKey)}
                          </span>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </FormControl>

              <FormMessage />
            </FormItem>
          )}
        />
      )}

      <CreateProjectInlineDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onCreated={handleProjectCreated}
      />
    </>
  );
}
