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

type ExportFormat = 'csv' | 'json';

const EXPORT_CONFIG = {
  csv: { action: exportSurveyCSV, field: 'csv', mime: 'text/csv', labelKey: 'exportCSV' },
  json: {
    action: exportSurveyJSON,
    field: 'json',
    mime: 'application/json',
    labelKey: 'exportJSON',
  },
} as const;

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
  const t = useTranslations();
  const [exporting, setExporting] = useState<ExportFormat | null>(null);

  const handleExport = async (format: ExportFormat) => {
    const { action, field, mime } = EXPORT_CONFIG[format];
    setExporting(format);

    try {
      const result = await action({ surveyId });

      if (result.success && result.data) {
        const content = (result.data as Record<string, string>)[field]!;
        downloadBlob(content, result.data.filename, mime);
      } else {
        toast.error(t('surveys.stats.exportFailed'));
      }
    } catch {
      toast.error(t('surveys.stats.exportFailed'));
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="flex gap-2">
      {(['csv', 'json'] as const).map((format) => (
        <Button
          key={format}
          variant="outline"
          size="sm"
          onClick={() => handleExport(format)}
          disabled={exporting !== null}
          className="gap-1.5"
        >
          <Download className="size-3.5" />
          {exporting === format
            ? t('surveys.stats.exporting')
            : t(`surveys.stats.${EXPORT_CONFIG[format].labelKey}`)}
        </Button>
      ))}
    </div>
  );
};
