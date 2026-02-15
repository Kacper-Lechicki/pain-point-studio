'use client';

import { useRef } from 'react';

import { Download, Linkedin, Mail, Twitter } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { QRCodeCanvas } from 'qrcode.react';

import { Button } from '@/components/ui/button';
import { ClipboardInput } from '@/components/ui/clipboard-input';
import { Separator } from '@/components/ui/separator';

function RedditIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
    </svg>
  );
}

interface SurveyShareContentProps {
  shareUrl: string;
  surveyTitle: string;
  /** Render in a narrow sidebar layout (smaller QR, stacked buttons). */
  compact?: boolean;
}

function buildShareUrls(url: string, title: string, body: string, emailSubject: string) {
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const tweetText = encodeURIComponent(`${body.split('\n')[0]}`);
  const encodedBody = encodeURIComponent(body);
  const encodedEmailSubject = encodeURIComponent(emailSubject);

  return {
    twitter: `https://twitter.com/intent/tweet?text=${tweetText}&url=${encodedUrl}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    email: `mailto:?subject=${encodedEmailSubject}&body=${encodedBody}`,
    reddit: `https://www.reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`,
  };
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

  const socialButtons = [
    { key: 'twitter', href: urls.twitter, icon: Twitter, label: t('surveys.publish.twitter') },
    { key: 'linkedin', href: urls.linkedin, icon: Linkedin, label: t('surveys.publish.linkedin') },
    { key: 'email', href: urls.email, icon: Mail, label: t('surveys.publish.email') },
    { key: 'reddit', href: urls.reddit, icon: RedditIcon, label: t('surveys.publish.reddit') },
  ] as const;

  const qrSize = compact ? 120 : 160;

  return (
    <div className={compact ? 'space-y-4' : 'space-y-5'}>
      {/* Copy link */}
      <div className="space-y-1.5">
        <label className={compact ? 'text-xs font-medium' : 'text-sm font-medium'}>
          {t('surveys.publish.shareLink')}
        </label>
        <ClipboardInput value={shareUrl} />
      </div>

      {/* QR code */}
      <div className="flex flex-col items-center gap-2">
        <div className="border-border rounded-lg border p-2">
          <QRCodeCanvas ref={qrRef} value={shareUrl} size={qrSize} level="M" />
        </div>
        <Button variant="outline" size="sm" onClick={handleDownloadQR}>
          <Download className="size-3.5" />
          {t('surveys.publish.downloadQR')}
        </Button>
      </div>

      <Separator />

      {/* Social sharing */}
      <div className="space-y-1.5">
        <label className={compact ? 'text-xs font-medium' : 'text-sm font-medium'}>
          {t('surveys.publish.shareVia')}
        </label>
        <div
          className={compact ? 'grid grid-cols-2 gap-1.5' : 'grid grid-cols-2 gap-2 sm:grid-cols-4'}
        >
          {socialButtons.map(({ key, href, icon: Icon, label }) => (
            <Button key={key} variant="outline" size="sm" asChild>
              <a href={href} target="_blank" rel="noopener noreferrer">
                <Icon className="size-3.5" />
                {label}
              </a>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
