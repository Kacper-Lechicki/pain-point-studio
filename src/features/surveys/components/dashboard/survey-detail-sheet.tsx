'use client';

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import type { UserSurvey } from '@/features/surveys/actions/get-user-surveys';
import { SurveyDetailPanel } from '@/features/surveys/components/dashboard/survey-detail-panel';
import type { MappedQuestion } from '@/features/surveys/lib/map-question-row';

interface SurveyDetailSheetProps {
  open: boolean;
  onClose: () => void;
  survey: UserSurvey | null;
  questions: MappedQuestion[] | null;
  /** Shared clock from the parent list — keeps relative times consistent. */
  now: Date;
  onStatusChange: (surveyId: string, action: string) => void;
  detailsLabel: string;
}

export function SurveyDetailSheet({
  open,
  onClose,
  survey,
  questions,
  now,
  onStatusChange,
  detailsLabel,
}: SurveyDetailSheetProps) {
  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent
        side="right"
        className="flex h-full w-[85%] max-w-[420px] flex-col gap-0 overflow-y-auto p-0 sm:max-w-[420px]"
        showCloseButton={true}
      >
        <SheetHeader className="border-border h-14 shrink-0 flex-row items-center gap-0 border-b px-4 py-0 pr-12">
          <SheetTitle className="text-foreground text-base font-semibold">
            {detailsLabel}
          </SheetTitle>
          <SheetDescription className="sr-only">{survey?.title}</SheetDescription>
        </SheetHeader>
        {open && survey && (
          <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-4 pb-16">
            <SurveyDetailPanel
              survey={survey}
              questions={questions}
              now={now}
              onStatusChange={onStatusChange}
              variant="sheet"
            />
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
