import { getTranslations } from 'next-intl/server';

import { AuthHeader } from '@/features/auth/components/common/auth-header';
import { OAuthLinks } from '@/features/auth/components/common/oauth-links';
import { SignInForm } from '@/features/auth/components/common/sign-in-form';
import { TermsText } from '@/features/auth/components/common/terms-text';

export default async function SignInPage() {
  const t = await getTranslations();

  return (
    <>
      <AuthHeader title={t('auth.welcomeBack')} description={t('auth.enterEmailToSignIn')} />

      <div className="grid gap-6">
        <SignInForm />
        <OAuthLinks />
      </div>

      <TermsText />
    </>
  );
}
