import { getTranslations } from 'next-intl/server';

import { ROUTES } from '@/config/routes';
import { AuthHeader } from '@/features/auth/components/auth-header';
import { OAuthSection } from '@/features/auth/components/oauth-section';
import { SignInForm } from '@/features/auth/components/sign-in-form';
import { TermsText } from '@/features/auth/components/terms-text';

export default async function SignInPage() {
  const t = await getTranslations();

  return (
    <>
      <AuthHeader
        title={t('auth.welcomeBack')}
        description={t('auth.enterEmailToSignIn')}
        linkText={t('auth.signUp')}
        linkHref={ROUTES.auth.signUp}
      />

      <div className="grid gap-6">
        <SignInForm />
        <OAuthSection />
      </div>

      <TermsText />
    </>
  );
}
