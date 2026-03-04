'use client';

import { useState } from 'react';

import { useRouter } from 'next/navigation';

import { zodResolver } from '@hookform/resolvers/zod';
import type { JSONContent } from '@tiptap/react';
import { AnimatePresence, motion } from 'motion/react';
import { useTranslations } from 'next-intl';
import { useForm, useWatch } from 'react-hook-form';

import { RichEditor, isTiptapEmpty } from '@/components/shared/rich-editor';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { checkProjectNameExists } from '@/features/projects/actions/check-project-name-exists';
import { createProject } from '@/features/projects/actions/create-project';
import { WizardImageStep } from '@/features/projects/components/wizard-image-step';
import { WizardStepLayout } from '@/features/projects/components/wizard-step-layout';
import { PROJECT_NAME_MAX_LENGTH, PROJECT_SUMMARY_MAX_LENGTH } from '@/features/projects/config';
import { getProjectDetailUrl } from '@/features/projects/lib/project-urls';
import { type CreateProjectInput, createProjectSchema } from '@/features/projects/types';
import { useFormAction } from '@/hooks/common/use-form-action';
import { useUnsavedChangesWarning } from '@/hooks/unsaved-changes-context';
import type { MessageKey } from '@/i18n/types';

type WizardStep = 1 | 2 | 3 | 4;
type Direction = 'forward' | 'backward';

const variants = {
  enter: (dir: Direction) => ({
    x: dir === 'forward' ? 40 : -40,
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (dir: Direction) => ({
    x: dir === 'forward' ? -40 : 40,
    opacity: 0,
  }),
};

interface CreateProjectWizardProps {
  userId: string;
}

export function CreateProjectWizard({ userId }: CreateProjectWizardProps) {
  const t = useTranslations();
  const router = useRouter();

  const [step, setStep] = useState<WizardStep>(1);
  const [direction, setDirection] = useState<Direction>('forward');
  const [projectId, setProjectId] = useState<string | null>(null);
  const [projectName, setProjectName] = useState('');

  const action = useFormAction<{ projectId: string }>({
    successMessage: 'projects.create.success' as MessageKey,
    unexpectedErrorMessage: 'projects.errors.unexpected' as MessageKey,
  });

  const form = useForm<CreateProjectInput>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      name: '',
      summary: '',
      description: undefined,
    },
  });

  const hasDirtyFields = Object.keys(form.formState.dirtyFields).length > 0;
  const description = useWatch({ control: form.control, name: 'description' });

  useUnsavedChangesWarning('create-project-wizard', hasDirtyFields && !projectId);

  const goTo = (target: WizardStep, dir: Direction) => {
    setDirection(dir);
    setStep(target);
  };

  const validateNameUniqueness = async () => {
    const valid = await form.trigger('name');

    if (!valid) {
      return false;
    }

    const name = form.getValues('name');
    const result = await checkProjectNameExists({ name });

    if (result?.data?.exists) {
      form.setError('name', { message: 'projects.errors.nameAlreadyExists' });

      return false;
    }

    return true;
  };

  const handleNameBlur = async (rhfBlur: () => void) => {
    rhfBlur();

    const name = form.getValues('name');

    if (name.trim()) {
      await validateNameUniqueness();
    }
  };

  const handleNextFromName = async () => {
    if (await validateNameUniqueness()) {
      goTo(2, 'forward');
    }
  };

  const handleNextFromSummary = async () => {
    const valid = await form.trigger('summary');

    if (valid) {
      goTo(3, 'forward');
    }
  };

  const handleNextFromDescription = () => {
    goTo(4, 'forward');
  };

  const onSubmit = async (data: CreateProjectInput) => {
    const result = await action.execute(createProject, data);

    if (result?.data?.projectId) {
      setProjectId(result.data.projectId);
      setProjectName(data.name);
    }
  };

  const handleDone = () => {
    if (projectId) {
      router.push(getProjectDetailUrl(projectId));
    }
  };

  const handleDescriptionChange = (json: JSONContent) => {
    form.setValue('description', json, { shouldDirty: true });
  };

  const handleFormKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      if (step === 1) {
        e.preventDefault();
        void handleNextFromName();
      } else if (step === 2) {
        e.preventDefault();
        void handleNextFromSummary();
      }
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} onKeyDown={handleFormKeyDown} className="w-full">
        <AnimatePresence mode="wait" custom={direction}>
          {step === 1 && (
            <motion.div
              key="step-1"
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <WizardStepLayout
                stepNumber={1}
                title={t('projects.create.steps.name.title')}
                hint={t('projects.create.steps.name.hint')}
                onNext={handleNextFromName}
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
                          autoFocus
                          {...field}
                          onBlur={() => handleNameBlur(field.onBlur)}
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
              </WizardStepLayout>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step-2"
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <WizardStepLayout
                stepNumber={2}
                title={t('projects.create.steps.summary.title')}
                hint={t('projects.create.steps.summary.hint')}
                onNext={handleNextFromSummary}
                onBack={() => goTo(1, 'backward')}
              >
                <FormField
                  control={form.control}
                  name="summary"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('projects.create.summaryLabel')}</FormLabel>

                      <FormControl>
                        <Textarea
                          placeholder={t('projects.create.summaryPlaceholder')}
                          className="min-h-[120px] resize-none"
                          rows={5}
                          maxLength={PROJECT_SUMMARY_MAX_LENGTH}
                          autoFocus
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
              </WizardStepLayout>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step-3"
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <WizardStepLayout
                stepNumber={3}
                title={t('projects.create.steps.description.title')}
                hint={t('projects.create.steps.description.hint')}
                onNext={handleNextFromDescription}
                onBack={() => goTo(2, 'backward')}
              >
                <FormItem>
                  <FormLabel>{t('projects.create.steps.description.label')}</FormLabel>
                  <RichEditor
                    content={description ?? null}
                    onChange={handleDescriptionChange}
                    placeholder={t('projects.create.steps.description.placeholder')}
                    autoFocus
                    showHint
                    className="bg-transparent shadow-none dark:bg-transparent [&_.tiptap]:max-h-[400px] [&_.tiptap]:overflow-y-auto"
                  />
                </FormItem>
              </WizardStepLayout>
            </motion.div>
          )}

          {step === 4 && !projectId && (
            <motion.div
              key="step-4"
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <WizardStepLayout
                stepNumber={4}
                title={t('projects.create.steps.confirm.title')}
                hint={t('projects.create.steps.confirm.hint')}
                onNext={() => {}}
                onBack={() => goTo(3, 'backward')}
                nextLabel={t('projects.create.navigation.createProject')}
                isLoading={action.isLoading}
                isSubmit
              >
                <div className="flex flex-col gap-5">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-medium underline">
                      {t('projects.create.name')}
                    </span>
                    <p className="text-sm">{form.getValues('name')}</p>
                  </div>

                  {form.getValues('summary') ? (
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-medium underline">
                        {t('projects.create.summaryLabel')}
                      </span>
                      <p className="text-muted-foreground text-sm">{form.getValues('summary')}</p>
                    </div>
                  ) : null}

                  {!isTiptapEmpty(description) ? (
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-medium underline">
                        {t('projects.create.steps.description.label')}
                      </span>
                      <RichEditor content={description ?? null} editable={false} />
                    </div>
                  ) : null}
                </div>
              </WizardStepLayout>
            </motion.div>
          )}

          {step === 4 && projectId && (
            <motion.div
              key="step-4-done"
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <WizardImageStep
                projectId={projectId}
                userId={userId}
                projectName={projectName}
                onDone={handleDone}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </form>
    </Form>
  );
}
