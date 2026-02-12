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
import type { CompletedData } from '@/features/surveys/types';

interface SurveyCompletionProps {
  responseId: string;
  answeredCount: number;
  totalQuestions: number;
  slug: string;
  onSubmitted: () => void;
  onBack: () => void;
}

export const SurveyCompletion = ({
  responseId,
  answeredCount,
  totalQuestions,
  slug,
  onSubmitted,
  onBack,
}: SurveyCompletionProps) => {
  const t = useTranslations('respondent.completion');
  const tErrors = useTranslations('respondent.errors');
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
        // Store in localStorage for duplicate detection
        try {
          localStorage.setItem(
            `pps_completed_${slug}`,
            JSON.stringify({ timestamp: Date.now(), responseId } satisfies CompletedData)
          );
        } catch {
          // localStorage may not be available
        }

        onSubmitted();
      } else {
        toast.error(tErrors('submitFailed'));
      }
    });
  };

  return (
    <PageTransition>
      <div className="space-y-8">
        <div>
          <h2 className="text-foreground text-xl font-semibold">{t('title')}</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            {t('summary', { answered: answeredCount, total: totalQuestions })}
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="text-foreground mb-1 text-sm font-medium">{t('contactTitle')}</h3>
            <p className="text-muted-foreground mb-3 text-xs">{t('contactDescription')}</p>
          </div>

          <div className="space-y-3">
            <div>
              <Label htmlFor="contact-name" className="text-sm">
                {t('name')}
              </Label>
              <Input
                id="contact-name"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder={t('namePlaceholder')}
                maxLength={100}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="contact-email" className="text-sm">
                {t('email')}
              </Label>
              <Input
                id="contact-email"
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder={t('emailPlaceholder')}
                maxLength={320}
                className="mt-1"
              />
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-foreground mb-1 text-sm font-medium">{t('feedbackTitle')}</h3>
          <Textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder={t('feedbackPlaceholder')}
            maxLength={2000}
            rows={4}
            className="mt-1 resize-none"
          />
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={onBack} disabled={isPending}>
            {t('back')}
          </Button>
          <Button onClick={handleSubmit} disabled={isPending} className="flex-1">
            {isPending ? t('submitting') : t('submit')}
          </Button>
        </div>
      </div>
    </PageTransition>
  );
};
