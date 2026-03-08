'use client';

import { useState } from 'react';

import { Download, FileSpreadsheet, FileText } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { exportSurveyCSV, exportSurveyJSON } from '@/features/surveys/actions';
import { EXPORT_FORMATS, type ExportFormat } from '@/features/surveys/config';
import { downloadBlob } from '@/lib/common/download-blob';
import { cn } from '@/lib/common/utils';

const EXPORT_ACTIONS = {
  csv: exportSurveyCSV,
  json: exportSurveyJSON,
} as const;

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  surveyId: string;
  surveyTitle: string;
}

export function ExportDialog({ open, onOpenChange, surveyId, surveyTitle }: ExportDialogProps) {
  const t = useTranslations('surveys.stats');
  const [exporting, setExporting] = useState<ExportFormat | null>(null);

  const handleExport = async (format: ExportFormat) => {
    const { field, mime } = EXPORT_FORMATS[format];
    const action = EXPORT_ACTIONS[format];

    setExporting(format);

    try {
      const result = await action({ surveyId });

      if (result.success && result.data) {
        const content = (result.data as Record<string, string>)[field]!;

        downloadBlob(content, result.data.filename, mime);
        onOpenChange(false);
      } else {
        toast.error(t('exportFailed'));
      }
    } catch {
      toast.error(t('exportFailed'));
    } finally {
      setExporting(null);
    }
  };

  const formats = [
    {
      format: 'csv' as const,
      icon: FileSpreadsheet,
      title: t('exportCSV'),
      description: t('exportCSVDescription'),
    },
    {
      format: 'json' as const,
      icon: FileText,
      title: t('exportJSON'),
      description: t('exportJSONDescription'),
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('exportTitle')}</DialogTitle>
          <DialogDescription className="sr-only">{t('exportTitle')}</DialogDescription>
        </DialogHeader>

        <div>
          <span className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
            {t('surveyNameLabel')}
          </span>
          <p className="text-foreground truncate text-sm">{surveyTitle}</p>
        </div>

        <div className="grid gap-2">
          {formats.map(({ format, icon: Icon, title, description }) => {
            const isExporting = exporting === format;
            const isDisabled = exporting !== null;

            return (
              <button
                key={format}
                type="button"
                onClick={() => handleExport(format)}
                disabled={isDisabled}
                className={cn(
                  'border-border md:hover:border-foreground/20 md:hover:bg-accent flex items-center gap-3 rounded-lg border p-3 text-left transition-colors',
                  'disabled:pointer-events-none disabled:opacity-50'
                )}
              >
                <div className="bg-muted flex size-10 shrink-0 items-center justify-center rounded-md">
                  {isExporting ? (
                    <Download className="text-muted-foreground size-5 animate-bounce" />
                  ) : (
                    <Icon className="text-muted-foreground size-5" />
                  )}
                </div>

                <div className="min-w-0">
                  <p className="text-foreground text-sm font-medium">
                    {isExporting ? t('exporting') : title}
                  </p>

                  <p className="text-muted-foreground text-xs">{description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
