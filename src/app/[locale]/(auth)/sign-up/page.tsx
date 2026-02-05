import { getTranslations } from 'next-intl/server';

import { ROUTES } from '@/config/routes';
import { AuthHeader } from '@/features/auth/components/auth-header';
import { OAuthSection } from '@/features/auth/components/oauth-section';
import { SignUpForm } from '@/features/auth/components/sign-up-form';
import { TermsText } from '@/features/auth/components/terms-text';

export default async function SignUpPage() {
  const t = await getTranslations();

  return (
    <>
      <AuthHeader
        title={t('auth.createAccount')}
        description={t('auth.enterEmailToCreate')}
        linkText={t('auth.signIn')}
        linkHref={ROUTES.auth.signIn}
      />

      <div className="grid gap-6">
        <SignUpForm />
        <OAuthSection />
      </div>

      <TermsText />
    </>
  );
}
