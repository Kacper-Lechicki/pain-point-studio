import { getTranslations } from 'next-intl/server';

import { BackButton } from '@/components/ui/back-button';
import { BRAND } from '@/config';
import { ROUTES } from '@/config';
import { Link } from '@/i18n/routing';

const Navbar = async () => {
  const t = await getTranslations();

  return (
    <nav className="bg-background/80 fixed inset-x-0 top-0 z-50 backdrop-blur-md transition-colors duration-300">
      <div className="container mx-auto flex h-16 items-center px-6 sm:px-4 lg:px-8">
        <div className="flex flex-1 items-center justify-start">
          <BackButton href={ROUTES.common.home} label={t('common.goBack')} />
        </div>

        <div className="flex min-w-0 flex-1 items-center justify-end">
          <Link href={ROUTES.common.home} className="truncate text-lg font-semibold tracking-tight">
            {t(BRAND.name)}
          </Link>
        </div>
      </div>
    </nav>
  );
};

export { Navbar };
