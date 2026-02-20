'use client';

import { useRef } from 'react';

import { Download } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { QRCodeCanvas } from 'qrcode.react';

import { Button } from '@/components/ui/button';
import { ClipboardInput } from '@/components/ui/clipboard-input';
import { Separator } from '@/components/ui/separator';
import { SOCIAL_CHANNELS } from '@/features/surveys/config';
import { buildShareUrls } from '@/features/surveys/lib/build-share-urls';
import { cn } from '@/lib/common/utils';

interface SurveyShareContentProps {
  shareUrl: string;
  surveyTitle: string;
  compact?: boolean;
}

export function SurveyShareContent({
  shareUrl,
  surveyTitle,
  compact = false,
}: SurveyShareContentProps) {
  const t = useTranslations();
  const qrRef = useRef<HTMLCanvasElement>(null);

  function handleDownloadQR() {
    const canvas = qrRef.current;

    if (!canvas) {
      return;
    }

    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');

    a.href = url;
    a.download = 'survey-qr-code.png';

    a.click();
  }

  const shareBody = t('surveys.publish.shareBody', { title: surveyTitle, url: shareUrl });
  const emailSubject = t('surveys.publish.shareEmailSubject', { title: surveyTitle });
  const urls = buildShareUrls(shareUrl, surveyTitle, shareBody, emailSubject);
  const qrSize = compact ? 88 : 160;

  return (
    <div className={compact ? 'space-y-4' : 'space-y-5'}>
      <div className="flex items-start gap-4">
        <div className="flex shrink-0 flex-col items-center gap-1">
          <div className="border-border shrink-0 overflow-hidden rounded-md border bg-white p-1">
            <QRCodeCanvas ref={qrRef} value={shareUrl} size={qrSize} level="M" />
          </div>

          <button
            type="button"
            onClick={handleDownloadQR}
            className={cn(
              'text-muted-foreground hover:text-foreground flex items-center gap-1 text-[10px] transition-colors',
              'focus-visible:ring-ring focus-visible:ring-1 focus-visible:outline-none'
            )}
          >
            <Download className="size-2.5" aria-hidden />
            {t('surveys.publish.downloadQR')}
          </button>
        </div>

        <div className="min-w-0 flex-1 space-y-1.5">
          <label className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
            {t('surveys.publish.shareLink')}
          </label>

          <ClipboardInput value={shareUrl} size={compact ? 'sm' : 'default'} />

          <p className="text-muted-foreground text-[11px] leading-snug">
            {t('surveys.publish.qrDescription')}
          </p>
        </div>
      </div>

      <Separator />

      <div className="space-y-2">
        <label className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
          {t('surveys.publish.shareVia')}
        </label>

        <div className="grid grid-cols-2 gap-2">
          {SOCIAL_CHANNELS.map(({ key, icon: Icon, iconClass, labelKey }) => (
            <Button key={key} variant="outline" size={compact ? 'md' : 'default'} asChild>
              <a href={urls[key]} target="_blank" rel="noopener noreferrer">
                <Icon className={cn('size-4', iconClass)} aria-hidden />
                {t(labelKey)}
              </a>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
