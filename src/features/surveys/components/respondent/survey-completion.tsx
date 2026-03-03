'use client';

import { useState, useTransition } from 'react';

import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageTransition } from '@/components/ui/page-transition';
import { Textarea } from '@/components/ui/textarea';
import { submitResponse } from '@/features/surveys/actions/respondent';
import {
  COMPLETION_CONTACT_EMAIL_MAX_LENGTH,
  COMPLETION_CONTACT_NAME_MAX_LENGTH,
  COMPLETION_FEEDBACK_MAX_LENGTH,
  surveyCompletedKey,
} from '@/features/surveys/config';
import type { CompletedData } from '@/features/surveys/types';

interface SurveyCompletionProps {
  responseId: string;
  answeredCount: number;
  totalQuestions: number;
  slug: string;
  onSubmitted: () => void;
  onBack: () => void;
  onSurveyClosed?: () => void;
}

export const SurveyCompletion = ({
  responseId,
  answeredCount,
  totalQuestions,
  slug,
  onSubmitted,
  onBack,
  onSurveyClosed,
}: SurveyCompletionProps) => {
  const t = useTranslations();
  const tErrors = useTranslations();
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [feedback, setFeedback] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleSubmit = () => {
    startTransition(async () => {
      const result = await submitResponse({
        responseId,
        contactName: contactName || undefined,
        contactEmail: contactEmail || undefined,
        feedback: feedback || undefined,
      });

      if (result.success) {
        try {
          localStorage.setItem(
            surveyCompletedKey(slug),
            JSON.stringify({ timestamp: Date.now(), responseId } satisfies CompletedData)
          );
        } catch {}

        onSubmitted();
      } else if (result.error && result.error.includes('closed.')) {
        onSurveyClosed?.();
      } else {
        toast.error(tErrors('respondent.errors.submitFailed'));
      }
    });
  };

  return (
    <PageTransition>
      <div className="space-y-8">
        <div>
          <h2 className="text-foreground text-xl font-semibold">
            {t('respondent.completion.title')}
          </h2>

          <p className="text-muted-foreground mt-1 text-sm">
            {t('respondent.completion.summary', { answered: answeredCount, total: totalQuestions })}
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="text-foreground mb-1 text-sm font-medium">
              {t('respondent.completion.contactTitle')}
            </h3>

            <p className="text-muted-foreground mb-3 text-xs">
              {t('respondent.completion.contactDescription')}
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <Label htmlFor="contact-name" className="text-sm">
                {t('respondent.completion.name')}
              </Label>

              <Input
                id="contact-name"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder={t('respondent.completion.namePlaceholder')}
                maxLength={COMPLETION_CONTACT_NAME_MAX_LENGTH}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="contact-email" className="text-sm">
                {t('respondent.completion.email')}
              </Label>

              <Input
                id="contact-email"
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder={t('respondent.completion.emailPlaceholder')}
                maxLength={COMPLETION_CONTACT_EMAIL_MAX_LENGTH}
                className="mt-1"
              />
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-foreground mb-1 text-sm font-medium">
            {t('respondent.completion.feedbackTitle')}
          </h3>

          <Textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder={t('respondent.completion.feedbackPlaceholder')}
            maxLength={COMPLETION_FEEDBACK_MAX_LENGTH}
            rows={4}
            className="mt-1 resize-none"
          />
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={onBack} disabled={isPending}>
            {t('respondent.completion.back')}
          </Button>

          <Button onClick={handleSubmit} disabled={isPending} className="flex-1">
            {isPending ? t('respondent.completion.submitting') : t('respondent.completion.submit')}
          </Button>
        </div>
      </div>
    </PageTransition>
  );
};
