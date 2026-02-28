'use client';

import { useState } from 'react';

import { CheckCircle2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { ProjectImageUpload } from '@/features/projects/components/project-image-upload';

interface WizardImageStepProps {
  projectId: string;
  userId: string;
  projectName: string;
  onDone: () => void;
}

export function WizardImageStep({ projectId, userId, projectName, onDone }: WizardImageStepProps) {
  const t = useTranslations('projects.create.steps.image');
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-center gap-8 py-4">
      {/* Success message */}
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-emerald-500/10">
          <CheckCircle2 className="size-6 text-emerald-500" aria-hidden />
        </div>
        <h2 className="text-xl font-semibold">{t('successMessage')}</h2>
        <p className="text-muted-foreground text-sm">{t('hint')}</p>
      </div>

      {/* Image upload */}
      <div className="flex flex-col items-center gap-3">
        <div className="flex items-center gap-2">
          <ProjectImageUpload
            projectId={projectId}
            userId={userId}
            imageUrl={imageUrl}
            projectName={projectName}
            onImageChange={setImageUrl}
          />
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-3">
        <Button type="button" variant="ghost" onClick={onDone}>
          {t('skipLabel')}
        </Button>
        <Button type="button" onClick={onDone}>
          {t('doneLabel')}
        </Button>
      </div>
    </div>
  );
}
