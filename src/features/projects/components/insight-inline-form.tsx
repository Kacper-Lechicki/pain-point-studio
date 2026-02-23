'use client';

import { useCallback, useRef, useState } from 'react';

import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { createInsight } from '@/features/projects/actions/create-insight';
import { INSIGHT_COLORS, INSIGHT_ICONS } from '@/features/projects/config/insight-colors';
import type { InsightType, ProjectInsight, ResearchPhase } from '@/features/projects/types';
import { INSIGHT_TYPES } from '@/features/projects/types';
import { useFormAction } from '@/hooks/common/use-form-action';
import type { MessageKey } from '@/i18n/types';
import { cn } from '@/lib/common/utils';

interface InsightInlineFormProps {
  projectId: string;
  /** Pre-selected type (fixed in scorecard sections, selectable in phase sections). */
  type?: InsightType;
  /** Phase to attach the insight to (null = scorecard-level). */
  phase?: ResearchPhase | null;
  /** Whether to show a type selector (for phase-level forms). */
  showTypeSelector?: boolean;
  onCreated: (insight: ProjectInsight) => void;
}

export function InsightInlineForm({
  projectId,
  type: fixedType,
  phase = null,
  showTypeSelector = false,
  onCreated,
}: InsightInlineFormProps) {
  const t = useTranslations();
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState('');
  const [selectedType, setSelectedType] = useState<InsightType>(fixedType ?? 'strength');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const action = useFormAction<{ insightId: string }>({
    unexpectedErrorMessage: 'projects.errors.unexpected' as MessageKey,
  });

  const activeType = fixedType ?? selectedType;

  const handleOpen = useCallback(() => {
    setIsOpen(true);
    setContent('');

    if (!fixedType) {
      setSelectedType('strength');
    }

    requestAnimationFrame(() => {
      textareaRef.current?.focus();
    });
  }, [fixedType]);

  const handleCancel = useCallback(() => {
    setIsOpen(false);
    setContent('');
  }, []);

  const handleSubmit = useCallback(async () => {
    const trimmed = content.trim();

    if (!trimmed) {
      return;
    }

    const result = await action.execute(createInsight, {
      projectId,
      phase: phase ?? undefined,
      type: activeType,
      content: trimmed,
    });

    if (result && !result.error && result.data) {
      const newInsight: ProjectInsight = {
        id: result.data.insightId,
        project_id: projectId,
        phase: phase ?? null,
        type: activeType,
        content: trimmed,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      onCreated(newInsight);
      toast.success(t('projects.scorecard.createSuccess' as MessageKey));
      setContent('');
      setIsOpen(false);
    }
  }, [content, action, projectId, phase, activeType, onCreated, t]);

  if (!isOpen) {
    return (
      <Button variant="ghost" size="sm" className="self-start" onClick={handleOpen}>
        <Plus className="size-3.5" aria-hidden />
        {t('projects.scorecard.addNote' as MessageKey)}
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {showTypeSelector && (
        <div className="flex items-center gap-1">
          {INSIGHT_TYPES.map((insightType) => {
            const Icon = INSIGHT_ICONS[insightType];
            const colors = INSIGHT_COLORS[insightType];
            const isActive = selectedType === insightType;

            return (
              <Button
                key={insightType}
                variant="ghost"
                size="sm"
                className={cn('gap-1.5 text-xs', isActive && cn(colors.bg, colors.text))}
                onClick={() => setSelectedType(insightType)}
              >
                <Icon className="size-3" aria-hidden />
                {t(`projects.insightTypes.${insightType}` as MessageKey)}
              </Button>
            );
          })}
        </div>
      )}

      <Textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={t('projects.scorecard.contentPlaceholder' as MessageKey)}
        maxLength={500}
        size="sm"
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            void handleSubmit();
          }

          if (e.key === 'Escape') {
            handleCancel();
          }
        }}
      />

      <div className="flex items-center gap-1.5">
        <Button size="sm" onClick={handleSubmit} disabled={action.isLoading || !content.trim()}>
          {t('projects.scorecard.saveNote' as MessageKey)}
        </Button>

        <Button variant="ghost" size="sm" onClick={handleCancel}>
          {t('projects.scorecard.cancelNote' as MessageKey)}
        </Button>
      </div>
    </div>
  );
}
