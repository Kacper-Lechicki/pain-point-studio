'use client';

import { useCallback, useMemo, useState } from 'react';

import { useRouter } from 'next/navigation';

import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronLeft, Plus, Settings } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';

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
import { ROUTES } from '@/config/routes';
import { useBreadcrumbSegment } from '@/features/dashboard/components/layout/breadcrumb-context';
import type { SubPanelLink } from '@/features/dashboard/components/layout/sub-panel-items-context';
import { useSubPanelLinks } from '@/features/dashboard/components/layout/sub-panel-items-context';
import { WizardStepLayout } from '@/features/projects/components/wizard-step-layout';
import { isProjectArchived } from '@/features/projects/lib/project-helpers';
import { createSurveyDraft } from '@/features/surveys/actions';
import { SURVEY_DESCRIPTION_MAX_LENGTH, SURVEY_TITLE_MAX_LENGTH } from '@/features/surveys/config';
import { getCreateSurveyUrl, getSurveyEditUrl } from '@/features/surveys/lib/survey-urls';
import {
  SURVEY_VISIBILITY_VALUES,
  type SurveyMetadataSchema,
  surveyMetadataSchema,
} from '@/features/surveys/types';
import { useFormAction } from '@/hooks/common/use-form-action';
import { useUnsavedChangesWarning } from '@/hooks/unsaved-changes-context';
import type { MessageKey } from '@/i18n/types';

type WizardStep = 1 | 2 | 3;
type Direction = 'forward' | 'backward';

const TOTAL_STEPS = 3;

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

interface CreateSurveyWizardProps {
  projectId: string;
  projectName: string;
  projectStatus: string;
}

export function CreateSurveyWizard({
  projectId,
  projectName,
  projectStatus,
}: CreateSurveyWizardProps) {
  const t = useTranslations();
  const router = useRouter();

  const [step, setStep] = useState<WizardStep>(1);
  const [direction, setDirection] = useState<Direction>('forward');
  const [createdSurveyId, setCreatedSurveyId] = useState<string | null>(null);

  // ── Breadcrumb + sub-panel links (sidebar) ───────────────────────
  useBreadcrumbSegment(projectId, projectName);

  const isArchived = isProjectArchived(projectStatus);

  const topLinks = useMemo<SubPanelLink[]>(
    () => [
      {
        label: t('common.backToProjects'),
        href: ROUTES.dashboard.projects,
        icon: ChevronLeft,
      },
    ],
    [t]
  );

  const bottomLinks = useMemo<SubPanelLink[]>(
    () => [
      ...(!isArchived
        ? [
            {
              label: t('projects.detail.createSurvey'),
              href: getCreateSurveyUrl(projectId),
              icon: Plus,
            },
          ]
        : []),
      {
        label: t('projects.detail.settings'),
        href: '#',
        icon: Settings,
        disabled: true,
      },
    ],
    [projectId, isArchived, t]
  );

  useSubPanelLinks(topLinks, bottomLinks);

  // ── Form ──────────────────────────────────────────────────────────

  const action = useFormAction<{ surveyId: string }>({
    successMessage: 'surveys.create.success' as MessageKey,
    unexpectedErrorMessage: 'surveys.errors.unexpected' as MessageKey,
  });

  const form = useForm<SurveyMetadataSchema>({
    resolver: zodResolver(surveyMetadataSchema),
    defaultValues: {
      title: '',
      description: '',
      visibility: SURVEY_VISIBILITY_VALUES[0],
      projectId,
      researchPhase: null,
    },
  });

  const hasDirtyFields = Object.keys(form.formState.dirtyFields).length > 0;

  useUnsavedChangesWarning('create-survey-wizard', hasDirtyFields && !createdSurveyId);

  const goTo = useCallback((target: WizardStep, dir: Direction) => {
    setDirection(dir);
    setStep(target);
  }, []);

  const handleNextFromTitle = useCallback(async () => {
    const valid = await form.trigger('title');

    if (valid) {
      goTo(2, 'forward');
    }
  }, [form, goTo]);

  const handleNextFromDescription = useCallback(async () => {
    const valid = await form.trigger('description');

    if (valid) {
      goTo(3, 'forward');
    }
  }, [form, goTo]);

  const onSubmit = useCallback(
    async (data: SurveyMetadataSchema) => {
      const result = await action.execute(createSurveyDraft, {
        ...data,
        projectId,
        researchPhase: null,
        action: 'next',
      });

      if (result?.data?.surveyId) {
        setCreatedSurveyId(result.data.surveyId);
        router.push(getSurveyEditUrl(result.data.surveyId));
      }
    },
    [action, projectId, router]
  );

  // Intercept Enter on steps 1-2 to advance instead of submitting the form.
  const handleFormKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        if (step === 1) {
          e.preventDefault();
          void handleNextFromTitle();
        } else if (step === 2) {
          e.preventDefault();
          void handleNextFromDescription();
        }
      }
    },
    [step, handleNextFromTitle, handleNextFromDescription]
  );

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
                totalSteps={TOTAL_STEPS}
                stepIndicatorLabel={t('surveys.create.stepIndicator', {
                  current: 1,
                  total: TOTAL_STEPS,
                })}
                title={t('surveys.create.steps.title.title')}
                hint={t('surveys.create.steps.title.hint')}
                onNext={handleNextFromTitle}
              >
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
                          autoFocus
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
                totalSteps={TOTAL_STEPS}
                stepIndicatorLabel={t('surveys.create.stepIndicator', {
                  current: 2,
                  total: TOTAL_STEPS,
                })}
                backLabel={t('surveys.create.navigation.back')}
                title={t('surveys.create.steps.description.title')}
                hint={t('surveys.create.steps.description.hint')}
                onNext={handleNextFromDescription}
                onBack={() => goTo(1, 'backward')}
              >
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('surveys.create.surveyDescription')}</FormLabel>

                      <FormControl>
                        <Textarea
                          placeholder={t('surveys.create.surveyDescriptionPlaceholder')}
                          className="min-h-[120px] resize-none"
                          rows={5}
                          maxLength={SURVEY_DESCRIPTION_MAX_LENGTH}
                          autoFocus
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
                totalSteps={TOTAL_STEPS}
                stepIndicatorLabel={t('surveys.create.stepIndicator', {
                  current: 3,
                  total: TOTAL_STEPS,
                })}
                backLabel={t('surveys.create.navigation.back')}
                title={t('surveys.create.steps.confirm.title')}
                hint={t('surveys.create.steps.confirm.hint')}
                onNext={() => {}}
                onBack={() => goTo(2, 'backward')}
                nextLabel={t('surveys.create.navigation.createSurvey')}
                isLoading={action.isLoading}
                isSubmit
              >
                <div className="flex flex-col gap-5">
                  {/* Title */}
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-medium underline">
                      {t('surveys.create.surveyTitle')}
                    </span>
                    <p className="text-sm">{form.getValues('title')}</p>
                  </div>

                  {/* Description */}
                  {form.getValues('description') ? (
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-medium underline">
                        {t('surveys.create.surveyDescription')}
                      </span>
                      <p className="text-muted-foreground text-sm">
                        {form.getValues('description')}
                      </p>
                    </div>
                  ) : null}
                </div>
              </WizardStepLayout>
            </motion.div>
          )}
        </AnimatePresence>
      </form>
    </Form>
  );
}
