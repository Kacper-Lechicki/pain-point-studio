import { LogIn } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

import { PageTransition } from '@/components/ui/page-transition';
import { ROUTES } from '@/config';
import { AuthHeader } from '@/features/auth/components/common/auth-header';
import { OAuthLinks } from '@/features/auth/components/common/oauth-links';
import { SignInForm } from '@/features/auth/components/common/sign-in-form';
import { TermsText } from '@/features/auth/components/common/terms-text';

export async function generateMetadata() {
  const t = await getTranslations();

  return {
    title: `${t('metadata.pages.signIn')} | ${t('metadata.title')}`,
    description: t('metadata.description'),
  };
}

export default async function SignInPage() {
  const t = await getTranslations();

  return (
    <PageTransition>
      <AuthHeader
        icon={LogIn}
        title={t('auth.welcomeBack')}
        description={t('auth.dontHaveAccount')}
        linkText={t('auth.signUp')}
        linkHref={ROUTES.auth.signUp}
      />

      <div className="grid gap-4">
        <SignInForm />
        <OAuthLinks />
      </div>

      <TermsText />
    </PageTransition>
  );
}
