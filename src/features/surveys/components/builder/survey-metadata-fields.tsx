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
import { CreateProjectInlineDialog } from '@/features/projects/components/create-project-inline-dialog';
import { PHASE_CONFIG } from '@/features/projects/config/phases';
import { RESEARCH_PHASES } from '@/features/projects/types';
import type { ProjectOption } from '@/features/surveys/actions';
import { SURVEY_DESCRIPTION_MAX_LENGTH, SURVEY_TITLE_MAX_LENGTH } from '@/features/surveys/config';
import type { SurveyMetadataSchema } from '@/features/surveys/types';
import type { MessageKey } from '@/i18n/types';
import { cn } from '@/lib/common/utils';

/** Sentinel value for "no project" in combobox. */
const NO_PROJECT_VALUE = '__none__';

/** Sentinel value for "no phase" in select. */
const NO_PHASE_VALUE = '__no_phase__';

interface SurveyMetadataFieldsProps {
  form: UseFormReturn<SurveyMetadataSchema>;
  projectOptions: ProjectOption[];
  /** Hide the project combobox, "Create Project" link, and research phase select (used in project context). */
  hideProjectField?: boolean | undefined;
}

export function SurveyMetadataFields({
  form,
  projectOptions,
  hideProjectField,
}: SurveyMetadataFieldsProps) {
  const t = useTranslations();
  const [localProjectOptions, setLocalProjectOptions] = useState<ProjectOption[]>(projectOptions);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const selectedProjectId = form.watch('projectId');

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
    },
    [form]
  );

  const handleProjectCreated = useCallback(
    (project: { id: string; name: string }) => {
      setLocalProjectOptions((prev) => [...prev, { value: project.id, label: project.name }]);
      form.setValue('projectId', project.id, { shouldDirty: true });
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

      {!hideProjectField && (
        <>
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

          {selectedProjectId && (
            <FormField
              control={form.control}
              name="researchPhase"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('projects.phases.label')}</FormLabel>

                  <FormControl>
                    <Select
                      value={field.value ?? NO_PHASE_VALUE}
                      onValueChange={(v) => field.onChange(v === NO_PHASE_VALUE ? null : v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t('projects.phases.placeholder')} />
                      </SelectTrigger>

                      <SelectContent>
                        <SelectItem value={NO_PHASE_VALUE}>
                          {t('projects.phases.noPhase')}
                        </SelectItem>

                        {RESEARCH_PHASES.map((phase) => {
                          const config = PHASE_CONFIG[phase];
                          const PhaseIcon = config.icon;

                          return (
                            <SelectItem key={phase} value={phase}>
                              <span className="flex items-center gap-2">
                                <PhaseIcon className={cn('size-4', config.colors.icon)} />
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
      )}
    </>
  );
}
