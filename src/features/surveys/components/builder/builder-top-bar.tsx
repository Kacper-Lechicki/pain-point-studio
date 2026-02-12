'use client';

import { useState } from 'react';

import { useRouter } from 'next/navigation';

import { ArrowLeft, Check, List, Loader2, Pencil, Save, Send, Settings2 } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Spinner } from '@/components/ui/spinner';
import { ROUTES } from '@/config/routes';
import { UserMenu } from '@/features/auth/components/common/user-menu';
import { publishSurvey, saveSurveyQuestions } from '@/features/surveys/actions';
import type { SurveyCategoryOption } from '@/features/surveys/actions';
import type { SurveyMetadataSchema } from '@/features/surveys/types';
import { useFormAction } from '@/hooks/common/use-form-action';
import Link from '@/i18n/link';
import type { MessageKey } from '@/i18n/types';
import { env } from '@/lib/common/env';

import { useQuestionBuilderContext } from '../../hooks/use-question-builder-context';
import { useUnsavedChangesWarning } from '../../hooks/use-unsaved-changes-warning';
import { SurveyMetadataForm } from '../survey-metadata-form';
import { PublishSuccessDialog } from './publish-success-dialog';

interface BuilderTopBarProps {
  surveyId: string;
  surveyTitle: string;
  surveyStatus: string;
  surveyMetadata: Omit<SurveyMetadataSchema, 'title'>;
  categoryOptions: SurveyCategoryOption[];
  isDesktop: boolean;
  onToggleSidebar?: () => void;
  onToggleSettings?: () => void;
}

export function BuilderTopBar({
  surveyId,
  surveyTitle,
  surveyStatus,
  surveyMetadata,
  categoryOptions,
  isDesktop,
  onToggleSidebar,
  onToggleSettings,
}: BuilderTopBarProps) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const { state, dispatch, buildQuestionsPayload } = useQuestionBuilderContext();
  useUnsavedChangesWarning(state.isDirty);
  const [metadataDialogOpen, setMetadataDialogOpen] = useState(false);
  const [publishedSlug, setPublishedSlug] = useState<string | null>(null);

  const saveAction = useFormAction({
    successMessage: 'surveys.create.draftSaved' as MessageKey,
    unexpectedErrorMessage: 'surveys.builder.errors.saveFailed' as MessageKey,
    onSuccess: () => {
      dispatch({ type: 'MARK_CLEAN' });
      dispatch({ type: 'SET_SAVE_STATUS', payload: { status: 'saved' } });
    },
    onError: () => {
      dispatch({ type: 'SET_SAVE_STATUS', payload: { status: 'error' } });
    },
  });

  const publishAction = useFormAction<{ slug: string }>({
    successMessage: 'surveys.builder.published' as MessageKey,
    unexpectedErrorMessage: 'surveys.errors.unexpected' as MessageKey,
    onSuccess: (data) => {
      if (data?.slug) {
        setPublishedSlug(data.slug);
      } else {
        router.push(ROUTES.dashboard.surveys);
      }
    },
  });

  const hasQuestions = state.questions.some((q) => q.text.trim().length > 0);
  const canPublish = hasQuestions && surveyStatus === 'draft';

  async function handleSave() {
    dispatch({ type: 'SET_SAVE_STATUS', payload: { status: 'saving' } });
    await saveAction.execute(saveSurveyQuestions, {
      surveyId,
      questions: buildQuestionsPayload(),
    });
  }

  async function handlePublish() {
    dispatch({ type: 'SET_SAVE_STATUS', payload: { status: 'saving' } });
    const saveResult = await saveAction.execute(saveSurveyQuestions, {
      surveyId,
      questions: buildQuestionsPayload(),
    });

    if (saveResult?.error) {
      toast.error(t('surveys.builder.errors.saveFailed' as MessageKey));

      return;
    }

    await publishAction.execute(publishSurvey, { surveyId });
  }

  const isLoading = saveAction.isLoading || publishAction.isLoading;

  return (
    <>
      {isDesktop ? (
        /* ── Desktop: single row ─────────────────────────────────────── */
        <div className="border-border flex h-12 shrink-0 items-center gap-4 border-b px-4">
          <div className="flex min-w-0 items-center gap-1.5">
            <Link
              href={ROUTES.dashboard.surveys}
              className="text-muted-foreground hover:text-foreground flex shrink-0 items-center gap-1.5 text-sm transition-colors"
              aria-label={t('surveys.builder.backToSurveys')}
            >
              <ArrowLeft className="size-4 shrink-0" aria-hidden />
              {t('surveys.title')}
            </Link>
            <span className="text-muted-foreground text-sm">/</span>
            <span className="min-w-0 truncate text-sm font-medium">{surveyTitle}</span>
            <Button
              variant="ghost"
              size="icon-xs"
              className="shrink-0"
              onClick={() => setMetadataDialogOpen(true)}
              aria-label={t('surveys.builder.editMetadata')}
            >
              <Pencil className="size-3" />
            </Button>
          </div>

          <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
            {state.saveStatus === 'saving' && (
              <>
                <Loader2 className="size-3 animate-spin" />
                {t('surveys.builder.saving')}
              </>
            )}
            {state.saveStatus === 'saved' && (
              <>
                <Check className="size-3" />
                {t('surveys.builder.saved')}
              </>
            )}
            {state.saveStatus === 'error' && (
              <span className="text-destructive">{t('surveys.builder.saveError')}</span>
            )}
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-2">
            <Button variant="outline" size="sm" disabled={isLoading} onClick={handleSave}>
              {saveAction.isLoading && <Spinner />}
              {t('surveys.builder.saveDraft')}
            </Button>
            <Button size="sm" disabled={isLoading || !canPublish} onClick={handlePublish}>
              {publishAction.isLoading && <Spinner />}
              {t('surveys.builder.publish')}
            </Button>
            <div className="ml-4">
              <UserMenu />
            </div>
          </div>
        </div>
      ) : (
        /* ── Mobile: two rows for clarity ─────────────────────────────── */
        <div className="border-border shrink-0 border-b">
          {/* Row 1: navigation breadcrumb + user menu */}
          <div className="flex min-h-11 items-center gap-1.5 px-3 py-2">
            <Link
              href={ROUTES.dashboard.surveys}
              className="text-muted-foreground hover:text-foreground flex shrink-0 items-center gap-1.5 text-xs transition-colors"
              aria-label={t('surveys.builder.backToSurveys')}
            >
              <ArrowLeft className="size-3.5 shrink-0" aria-hidden />
              {t('surveys.title')}
            </Link>
            <span className="text-muted-foreground text-xs">/</span>
            <span className="min-w-0 truncate text-xs font-medium">{surveyTitle}</span>
            <Button
              variant="ghost"
              size="icon-xs"
              className="shrink-0"
              onClick={() => setMetadataDialogOpen(true)}
              aria-label={t('surveys.builder.editMetadata')}
            >
              <Pencil className="size-3" />
            </Button>
            <div className="ml-auto shrink-0">
              <UserMenu />
            </div>
          </div>

          {/* Row 2: panel toggles + save status + actions */}
          <div className="border-border flex min-h-10 items-center justify-between gap-2 border-t px-3 py-2">
            <div className="flex shrink-0 items-center gap-1">
              <Button
                variant="ghost"
                size="icon-sm"
                className="-ml-1.5"
                onClick={onToggleSidebar}
                aria-label={t('surveys.builder.questions')}
              >
                <List className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={onToggleSettings}
                aria-label={t('surveys.builder.questionSettings')}
              >
                <Settings2 className="size-4" />
              </Button>
            </div>

            <div className="text-muted-foreground flex min-w-0 items-center gap-1.5 text-xs">
              {state.saveStatus === 'saving' && (
                <>
                  <Loader2 className="size-3 animate-spin" />
                  <span className="truncate">{t('surveys.builder.saving')}</span>
                </>
              )}
              {state.saveStatus === 'saved' && (
                <>
                  <Check className="size-3" />
                  <span className="truncate">{t('surveys.builder.saved')}</span>
                </>
              )}
              {state.saveStatus === 'error' && (
                <span className="text-destructive truncate">{t('surveys.builder.saveError')}</span>
              )}
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <Button
                variant="outline"
                size="icon-sm"
                disabled={isLoading}
                onClick={handleSave}
                aria-label={t('surveys.builder.saveDraft')}
              >
                {saveAction.isLoading ? <Spinner /> : <Save className="size-4" />}
              </Button>
              <Button
                size="icon-sm"
                disabled={isLoading || !canPublish}
                onClick={handlePublish}
                aria-label={t('surveys.builder.publish')}
              >
                {publishAction.isLoading ? <Spinner /> : <Send className="size-4" />}
              </Button>
            </div>
          </div>
        </div>
      )}

      <Dialog open={metadataDialogOpen} onOpenChange={setMetadataDialogOpen}>
        <DialogContent className="flex h-[100dvh] max-w-full flex-col gap-0 overflow-hidden rounded-none p-0 sm:h-auto sm:max-h-[70vh] sm:max-w-2xl sm:rounded-lg">
          <DialogHeader className="shrink-0 border-b px-6 py-4">
            <DialogTitle>{t('surveys.builder.editMetadata')}</DialogTitle>
            <DialogDescription className="sr-only">
              {t('surveys.builder.editMetadata')}
            </DialogDescription>
          </DialogHeader>
          <SurveyMetadataForm
            categoryOptions={categoryOptions}
            surveyId={surveyId}
            mode="edit"
            defaultValues={{
              title: surveyTitle,
              ...surveyMetadata,
            }}
            onSaved={() => {
              setMetadataDialogOpen(false);
              router.refresh();
            }}
            renderFooter={({ handleSave, isLoading: formLoading }) => (
              <div className="shrink-0 border-t px-6 py-4">
                <div className="flex justify-end">
                  <Button disabled={formLoading} onClick={handleSave}>
                    {formLoading && <Spinner />}
                    {t('surveys.create.saveDraft')}
                  </Button>
                </div>
              </div>
            )}
          />
        </DialogContent>
      </Dialog>

      {publishedSlug && (
        <PublishSuccessDialog
          open
          shareUrl={`${env.NEXT_PUBLIC_APP_URL}/${locale}/r/${publishedSlug}`}
          surveyId={surveyId}
          surveyTitle={surveyTitle}
          onClose={() => {
            setPublishedSlug(null);
            router.push(ROUTES.dashboard.surveys);
          }}
        />
      )}
    </>
  );
}
