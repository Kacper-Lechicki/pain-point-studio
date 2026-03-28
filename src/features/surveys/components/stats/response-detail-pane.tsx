'use client';

import { useCallback, useEffect, useState, useTransition } from 'react';

import { useTranslations } from 'next-intl';

import { getResponseDetail } from '@/features/surveys/actions/get-response-detail';
import type {
  ResponseDetail,
  SurveyResponseListItem,
} from '@/features/surveys/types/response-list';

import { ResponseDetailBody } from './response-detail-body';
import { ResponseDetailHeader } from './response-detail-header';

interface ResponseDetailPaneProps {
  selectedId: string | null;
  selectedMeta: SurveyResponseListItem | null;
  compact?: boolean | undefined;
  hideHeader?: boolean | undefined;
}

export function ResponseDetailPane({
  selectedId,
  selectedMeta,
  compact,
  hideHeader,
}: ResponseDetailPaneProps) {
  const t = useTranslations('surveys.stats.responseList');
  const [detail, setDetail] = useState<ResponseDetail | null>(null);
  const [isLoading, startTransition] = useTransition();

  const fetchDetail = useCallback(
    (id: string) => {
      startTransition(async () => {
        const result = await getResponseDetail({ responseId: id });

        if (result.success && result.data) {
          setDetail(result.data);
        }
      });
    },
    [startTransition]
  );

  useEffect(() => {
    if (selectedId) {
      fetchDetail(selectedId);
    } else {
      setDetail(null); // eslint-disable-line react-hooks/set-state-in-effect
    }
  }, [selectedId, fetchDetail]);

  if (!selectedId || !selectedMeta) {
    return (
      <div className="flex h-full items-center justify-center" aria-live="polite">
        <p className="text-muted-foreground text-sm">{t('selectResponse')}</p>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col" aria-live="polite">
      {!hideHeader && <ResponseDetailHeader meta={selectedMeta} />}

      <ResponseDetailBody
        detail={detail}
        meta={selectedMeta}
        isLoading={isLoading}
        compact={compact}
      />
    </div>
  );
}
