'use client';

import { useRouter } from 'next/navigation';

import { useTranslations } from 'next-intl';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { SurveyMetadataForm } from '@/features/surveys/components/builder/survey-metadata-form';

interface CreateSurveyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The project to create the survey in (project_id is implicit). */
  projectId: string;
}

export function CreateSurveyDialog({ open, onOpenChange, projectId }: CreateSurveyDialogProps) {
  const t = useTranslations();
  const router = useRouter();

  const handleCreated = () => {
    onOpenChange(false);
    router.refresh();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('surveys.create.title')}</DialogTitle>
          <DialogDescription>{t('surveys.create.description')}</DialogDescription>
        </DialogHeader>

        <SurveyMetadataForm
          projectOptions={[]}
          defaultValues={{ projectId }}
          hideProjectField
          onCreated={handleCreated}
        />
      </DialogContent>
    </Dialog>
  );
}
