'use client';

import { useRef, useState } from 'react';

import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { createInsight } from '@/features/projects/actions/create-insight';
import { updateInsight } from '@/features/projects/actions/update-insight';
import { INSIGHT_CONTENT_MAX_LENGTH } from '@/features/projects/config';
import { INSIGHT_COLORS, INSIGHT_ICONS } from '@/features/projects/config/insight-colors';
import { INSIGHT_SOURCE_CONFIG } from '@/features/projects/config/insight-sources';
import type { InsightSource, InsightType, ProjectInsight } from '@/features/projects/types';
import { INSIGHT_SOURCES, INSIGHT_TYPES } from '@/features/projects/types';
import { useFormAction } from '@/hooks/common/use-form-action';
import type { MessageKey } from '@/i18n/types';
import { cn } from '@/lib/common/utils';

interface InsightDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  defaultType?: InsightType | undefined;
  editInsight?: ProjectInsight | undefined;
  onCreated?: ((insight: ProjectInsight) => void) | undefined;
  onUpdated?: ((insight: ProjectInsight) => void) | undefined;
}

export function InsightDialog({
  open,
  onOpenChange,
  projectId,
  defaultType,
  editInsight,
  onCreated,
  onUpdated,
}: InsightDialogProps) {
  const t = useTranslations();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [confirmDiscardOpen, setConfirmDiscardOpen] = useState(false);

  const isEdit = !!editInsight;

  const initialType = defaultType ?? (editInsight?.type as InsightType) ?? 'strength';
  const initialSource = (editInsight?.source as InsightSource) ?? 'own_observation';
  const initialContent = editInsight?.content ?? '';

  const [type, setType] = useState<InsightType>(initialType);
  const [source, setSource] = useState<InsightSource>(initialSource);
  const [content, setContent] = useState(initialContent);

  const isDirty = type !== initialType || source !== initialSource || content !== initialContent;

  const createAction = useFormAction<{ insightId: string }>({
    unexpectedErrorMessage: 'projects.errors.unexpected' as MessageKey,
  });

  const updateAction = useFormAction({
    unexpectedErrorMessage: 'projects.errors.unexpected' as MessageKey,
  });

  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen && isDirty) {
      setConfirmDiscardOpen(true);

      return;
    }

    onOpenChange(nextOpen);
  };

  const handleConfirmDiscard = () => {
    setConfirmDiscardOpen(false);
    onOpenChange(false);
  };

  const handleSubmit = async () => {
    const trimmed = content.trim();

    if (!trimmed) {
      return;
    }

    if (isEdit && editInsight) {
      const original = editInsight;
      const updated = {
        ...editInsight,
        type,
        source,
        content: trimmed,
        updated_at: new Date().toISOString(),
      };

      onUpdated?.(updated);
      onOpenChange(false);

      const result = await updateAction.execute(updateInsight, {
        insightId: editInsight.id,
        type,
        source,
        content: trimmed,
      });

      if (result?.error) {
        onUpdated?.(original);
      }
    } else {
      const result = await createAction.execute(createInsight, {
        projectId,
        type,
        source,
        content: trimmed,
      });

      if (result && !result.error && result.data) {
        const newInsight: ProjectInsight = {
          id: result.data.insightId,
          project_id: projectId,
          type,
          source,
          content: trimmed,
          phase: null,
          sort_order: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        onCreated?.(newInsight);
        onOpenChange(false);
      }
    }
  };

  const isLoading = createAction.isLoading || updateAction.isLoading;
  const placeholderKey = `projects.insights.contentPlaceholders.${type}` as MessageKey;

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t(
                isEdit
                  ? ('projects.insights.dialog.editTitle' as MessageKey)
                  : ('projects.insights.dialog.createTitle' as MessageKey)
              )}
            </DialogTitle>
            <DialogDescription className="sr-only">
              {t(
                isEdit
                  ? ('projects.insights.dialog.editTitle' as MessageKey)
                  : ('projects.insights.dialog.createTitle' as MessageKey)
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <Label>{t('projects.insights.dialog.typeLabel' as MessageKey)}</Label>
              <Select value={type} onValueChange={(v) => setType(v as InsightType)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INSIGHT_TYPES.map((insightType) => {
                    const Icon = INSIGHT_ICONS[insightType];
                    const colors = INSIGHT_COLORS[insightType];

                    return (
                      <SelectItem key={insightType} value={insightType}>
                        <div className="flex items-center gap-2">
                          <Icon className={cn('size-3.5', colors.icon)} />
                          {t(`projects.insights.types.${insightType}` as MessageKey)}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>{t('projects.insights.dialog.sourceLabel' as MessageKey)}</Label>
              <Select value={source} onValueChange={(v) => setSource(v as InsightSource)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INSIGHT_SOURCES.map((src) => {
                    const config = INSIGHT_SOURCE_CONFIG[src];
                    const Icon = config.icon;

                    return (
                      <SelectItem key={src} value={src}>
                        <div className="flex items-center gap-2">
                          <Icon className="text-muted-foreground size-3.5" />
                          {t(config.label as MessageKey)}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>{t('projects.insights.dialog.contentLabel' as MessageKey)}</Label>
              <Textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={t(placeholderKey)}
                className="min-h-[120px] resize-none"
                maxLength={INSIGHT_CONTENT_MAX_LENGTH}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                    void handleSubmit();
                  }
                }}
              />

              <div className="flex justify-end">
                <span className="text-muted-foreground text-xs">
                  {content.length}/{INSIGHT_CONTENT_MAX_LENGTH}
                </span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleClose(false)}>
              {t('common.cancel')}
            </Button>

            <Button onClick={handleSubmit} disabled={isLoading || !content.trim()}>
              {isLoading && <Spinner />}
              {t('common.actions.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmDiscardOpen}
        onOpenChange={setConfirmDiscardOpen}
        onConfirm={handleConfirmDiscard}
        title={t('common.unsavedChanges.title')}
        description={t('projects.insights.dialog.discardDescription' as MessageKey)}
        confirmLabel={t('projects.insights.dialog.discardConfirm' as MessageKey)}
        variant="destructive"
      />
    </>
  );
}
