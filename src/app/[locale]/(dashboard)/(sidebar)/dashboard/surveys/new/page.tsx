import { FileText, LayoutTemplate } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Badge } from '@/components/ui/badge';
import { PageTransition } from '@/components/ui/page-transition';
import { ROUTES } from '@/config/routes';
import Link from '@/i18n/link';

export default function NewSurveyPage() {
  const t = useTranslations('surveys.new');

  return (
    <PageTransition>
      <div className="max-w-3xl px-6 pt-4 pb-8 sm:px-4 md:pt-8 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">{t('title')}</h1>
          <p className="text-muted-foreground mt-1 text-sm">{t('description')}</p>
        </div>

        <div className="grid auto-rows-[1fr] gap-4 sm:grid-cols-2">
          {/* Template option — disabled / coming soon */}
          <div className="border-border flex flex-col rounded-lg border p-6 opacity-60">
            <div className="flex items-start justify-between">
              <div className="bg-muted mb-3 flex size-10 items-center justify-center rounded-lg">
                <LayoutTemplate className="text-muted-foreground size-5" />
              </div>
              <Badge variant="secondary">{t('template.comingSoon')}</Badge>
            </div>
            <h3 className="font-semibold">{t('template.title')}</h3>
            <p className="text-muted-foreground mt-1 flex-1 text-sm">{t('template.description')}</p>
            <p className="text-muted-foreground mt-3 text-xs">{t('template.badge')}</p>
          </div>

          {/* Scratch option — clickable */}
          <Link
            href={ROUTES.dashboard.surveysCreate}
            className="border-border hover:border-primary flex flex-col rounded-lg border p-6 transition-colors"
          >
            <div className="bg-muted mb-3 flex size-10 items-center justify-center rounded-lg">
              <FileText className="text-muted-foreground size-5" />
            </div>
            <h3 className="font-semibold">{t('scratch.title')}</h3>
            <p className="text-muted-foreground mt-1 flex-1 text-sm">{t('scratch.description')}</p>
          </Link>
        </div>
      </div>
    </PageTransition>
  );
}
