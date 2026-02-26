'use client';

import { useCallback, useRef, useState } from 'react';

import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { createInsight } from '@/features/projects/actions/create-insight';
import { INSIGHT_CONTENT_MAX_LENGTH } from '@/features/projects/config';
import { INSIGHT_COLORS, INSIGHT_ICONS } from '@/features/projects/config/insight-colors';
import type { InsightType, ProjectInsight } from '@/features/projects/types';
import { INSIGHT_TYPES } from '@/features/projects/types';
import { useFormAction } from '@/hooks/common/use-form-action';
import type { MessageKey } from '@/i18n/types';
import { cn } from '@/lib/common/utils';

interface InsightInlineFormProps {
  projectId: string;
  /** Pre-selected type (fixed in scorecard sections, selectable in phase sections). */
  type?: InsightType;
  /** Whether to show a type selector (for phase-level forms). */
  showTypeSelector?: boolean;
  /** When true, form is always visible (no toggle button). */
  alwaysOpen?: boolean;
  /** Called when user cancels (useful when form is in a dialog). */
  onCancel?: () => void;
  onCreated: (insight: ProjectInsight) => void;
}

export function InsightInlineForm({
  projectId,
  type: fixedType,
  showTypeSelector = false,
  alwaysOpen = false,
  onCancel,
  onCreated,
}: InsightInlineFormProps) {
  const t = useTranslations();
  const [isOpen, setIsOpen] = useState(alwaysOpen);
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
    if (!alwaysOpen) {
      setIsOpen(false);
    }

    setContent('');
    onCancel?.();
  }, [alwaysOpen, onCancel]);

  const handleSubmit = useCallback(async () => {
    const trimmed = content.trim();

    if (!trimmed) {
      return;
    }

    const result = await action.execute(createInsight, {
      projectId,
      type: activeType,
      content: trimmed,
    });

    if (result && !result.error && result.data) {
      const newInsight: ProjectInsight = {
        id: result.data.insightId,
        project_id: projectId,
        type: activeType,
        content: trimmed,
        phase: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      onCreated(newInsight);
      toast.success(t('projects.scorecard.createSuccess' as MessageKey));
      setContent('');

      if (alwaysOpen) {
        onCancel?.();
      } else {
        setIsOpen(false);
      }
    }
  }, [content, action, projectId, activeType, onCreated, t, alwaysOpen, onCancel]);

  if (!isOpen && !alwaysOpen) {
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
        maxLength={INSIGHT_CONTENT_MAX_LENGTH}
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
