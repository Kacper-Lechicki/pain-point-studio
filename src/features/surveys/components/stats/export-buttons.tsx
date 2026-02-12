'use client';

import { useState } from 'react';

import { Download } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { exportSurveyCSV, exportSurveyJSON } from '@/features/surveys/actions';

interface ExportButtonsProps {
  surveyId: string;
}

function downloadBlob(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export const ExportButtons = ({ surveyId }: ExportButtonsProps) => {
  const t = useTranslations('surveys.stats');
  const [exporting, setExporting] = useState<'csv' | 'json' | null>(null);

  const handleExportCSV = async () => {
    setExporting('csv');

    try {
      const result = await exportSurveyCSV({ surveyId });

      if (result.success && result.data) {
        downloadBlob(result.data.csv, result.data.filename, 'text/csv');
      } else {
        toast.error(t('exportFailed'));
      }
    } catch {
      toast.error(t('exportFailed'));
    } finally {
      setExporting(null);
    }
  };

  const handleExportJSON = async () => {
    setExporting('json');

    try {
      const result = await exportSurveyJSON({ surveyId });

      if (result.success && result.data) {
        downloadBlob(result.data.json, result.data.filename, 'application/json');
      } else {
        toast.error(t('exportFailed'));
      }
    } catch {
      toast.error(t('exportFailed'));
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleExportCSV}
        disabled={exporting !== null}
        className="gap-1.5"
      >
        <Download className="size-3.5" />
        {exporting === 'csv' ? t('exporting') : t('exportCSV')}
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={handleExportJSON}
        disabled={exporting !== null}
        className="gap-1.5"
      >
        <Download className="size-3.5" />
        {exporting === 'json' ? t('exporting') : t('exportJSON')}
      </Button>
    </div>
  );
};
