import { ArrowLeft } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

import { BRAND } from '@/config';
import { ROUTES } from '@/config';
import { Link } from '@/i18n/routing';

const Navbar = async () => {
  const t = await getTranslations();

  return (
    <nav className="sticky top-0 z-50 border-b backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center px-6 sm:px-4 lg:px-8">
        <div className="flex flex-1 items-center justify-start">
          <Link
            href={ROUTES.common.home}
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-sm transition-colors"
          >
            <ArrowLeft className="size-4" />
            {t('auth.backToHome')}
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-end">
          <Link href={ROUTES.common.home} className="text-lg font-semibold tracking-tight">
            {t(BRAND.name)}
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
