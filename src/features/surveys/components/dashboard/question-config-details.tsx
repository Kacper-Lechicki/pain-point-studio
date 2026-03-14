'use client';

import type { ReactNode } from 'react';

import { useTranslations } from 'next-intl';

import type { QuestionType } from '@/features/surveys/types';

interface QuestionConfigData {
  type: QuestionType;
  config: Record<string, unknown>;
  description?: string | null;
}

export function QuestionConfigDetails({ question }: { question: QuestionConfigData }) {
  const t = useTranslations();
  const config = question.config;
  const rows: ReactNode[] = [];

  if (question.description?.trim()) {
    rows.push(
      <p key="desc">
        <span className="font-medium">{t('surveys.dashboard.detailPanel.descriptionLabel')}:</span>{' '}
        {question.description.trim()}
      </p>
    );
  }

  if (question.type === 'open_text' || question.type === 'short_text') {
    const placeholder = (config.placeholder as string | undefined)?.trim();
    const maxLength = config.maxLength as number | undefined;

    if (placeholder) {
      rows.push(
        <p key="placeholder">
          <span className="font-medium">
            {t('surveys.dashboard.detailPanel.placeholderLabel')}:
          </span>{' '}
          {placeholder}
        </p>
      );
    }

    if (maxLength != null && maxLength > 0) {
      rows.push(
        <p key="maxLength">
          <span className="font-medium">{t('surveys.dashboard.detailPanel.maxLengthLabel')}:</span>{' '}
          {maxLength}
        </p>
      );
    }
  }

  if (question.type === 'multiple_choice') {
    const options = (config.options as string[] | undefined) ?? [];

    rows.push(
      <p key="options">
        <span className="font-medium">{t('surveys.dashboard.detailPanel.optionsLabel')}:</span>{' '}
        {t(
          'surveys.dashboard.detailPanel.optionsCount' as Parameters<typeof t>[0],
          { count: options.length } as never
        )}
      </p>
    );

    if (config.allowOther) {
      rows.push(<p key="other">{t('surveys.dashboard.detailPanel.allowOther')}</p>);
    }

    const minSel = config.minSelections as number | undefined;
    const maxSel = config.maxSelections as number | undefined;

    if (minSel != null && minSel > 0) {
      rows.push(
        <p key="minSel">
          <span className="font-medium">
            {t('surveys.dashboard.detailPanel.minSelectionsLabel')}:
          </span>{' '}
          {minSel}
        </p>
      );
    }

    if (maxSel != null && maxSel > 0) {
      rows.push(
        <p key="maxSel">
          <span className="font-medium">
            {t('surveys.dashboard.detailPanel.maxSelectionsLabel')}:
          </span>{' '}
          {maxSel}
        </p>
      );
    }
  }

  if (question.type === 'rating_scale') {
    const min = (config.min as number | undefined) ?? 1;
    const max = (config.max as number | undefined) ?? 5;
    const minLabel = (config.minLabel as string | undefined)?.trim();
    const maxLabel = (config.maxLabel as string | undefined)?.trim();

    rows.push(
      <p key="scale">
        <span className="font-medium">{t('surveys.dashboard.detailPanel.scaleLabel')}:</span>{' '}
        {t('surveys.dashboard.detailPanel.scale' as Parameters<typeof t>[0], { min, max } as never)}
      </p>
    );

    if (minLabel) {
      rows.push(
        <p key="minLabel">
          <span className="font-medium">{t('surveys.dashboard.detailPanel.minLabelLabel')}:</span>{' '}
          {minLabel}
        </p>
      );
    }

    if (maxLabel) {
      rows.push(
        <p key="maxLabel">
          <span className="font-medium">{t('surveys.dashboard.detailPanel.maxLabelLabel')}:</span>{' '}
          {maxLabel}
        </p>
      );
    }
  }

  if (rows.length === 0) {
    return null;
  }

  return <div className="text-muted-foreground mt-1.5 space-y-0.5 text-[10px]">{rows}</div>;
}
