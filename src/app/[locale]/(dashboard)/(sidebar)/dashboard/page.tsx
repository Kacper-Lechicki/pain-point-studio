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
    </PageTransition>
  );
}
