import { ClipboardList } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { PageTransition } from '@/components/ui/page-transition';
import { ROUTES } from '@/config/routes';
import Link from '@/i18n/link';

export default function DashboardPage() {
  const t = useTranslations('dashboard');

  return (
    <PageTransition>
      <div className="max-w-3xl px-6 pt-4 pb-8 sm:px-4 md:pt-8 lg:px-8">
        <EmptyState
          icon={ClipboardList}
          title={t('surveysEmpty.title')}
          description={t('surveysEmpty.description')}
          action={
            <Button asChild>
              <Link href={ROUTES.dashboard.surveysNew}>{t('surveysEmpty.cta')}</Link>
            </Button>
          }
        />
      </div>
    </PageTransition>
  );
}
