'use client';

import { Mail, User } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { ClipboardInput } from '@/components/ui/clipboard-input';
import { Skeleton } from '@/components/ui/skeleton';
import type {
  ResponseDetail,
  SurveyResponseListItem,
} from '@/features/surveys/types/response-list';

import { ResponseAnswerDisplay } from './response-answer-display';

interface ResponseDetailBodyProps {
  detail: ResponseDetail | null;
  meta: SurveyResponseListItem | null;
  isLoading: boolean;
  compact?: boolean | undefined;
}

export function ResponseDetailBody({ detail, meta, isLoading, compact }: ResponseDetailBodyProps) {
  const t = useTranslations('surveys.stats.responseList');

  const feedback = detail?.feedback ?? meta?.feedback;
  const contactName = detail?.contactName ?? meta?.contactName;
  const contactEmail = detail?.contactEmail ?? meta?.contactEmail;

  const hasContact = !!(contactName || contactEmail);
  const showSections = !!(detail || meta);

  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2 rounded-lg border p-4">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
          ))}
        </div>
      ) : detail?.answers && detail.answers.length > 0 ? (
        <div className="space-y-3">
          {detail.answers.map((answer, i) => (
            <ResponseAnswerDisplay
              key={answer.questionId}
              answer={answer}
              index={i}
              compact={compact}
            />
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground py-8 text-center text-sm">{t('noAnswers')}</p>
      )}

      {showSections && (
        <div className="mt-4 flex flex-col gap-2">
          <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
            {t('feedback')}
          </p>

          {feedback ? (
            <div className="border-border/50 bg-muted rounded-md border px-3 py-2.5">
              <p className="text-foreground text-sm leading-relaxed whitespace-pre-wrap">
                {feedback}
              </p>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm italic">{t('noFeedback')}</p>
          )}
        </div>
      )}

      {showSections && (
        <div className="mt-4 flex flex-col gap-2">
          <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
            {t('contact')}
          </p>

          {hasContact ? (
            <div className="flex flex-col gap-2">
              {contactName && (
                <div className="text-foreground flex items-center gap-2 text-sm">
                  <User className="text-muted-foreground size-3.5 shrink-0" />
                  {contactName}
                </div>
              )}

              {contactEmail && (
                <div className="flex items-start gap-2">
                  <Mail className="text-muted-foreground mt-2.5 size-3.5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <ClipboardInput value={contactEmail} size="sm" />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm italic">{t('noContact')}</p>
          )}
        </div>
      )}
    </div>
  );
}
