import { getTranslations } from 'next-intl/server';

import { AuthHeader } from '@/features/auth/components/common/auth-header';
import { OAuthSection } from '@/features/auth/components/common/oauth-section';
import { SignUpForm } from '@/features/auth/components/common/sign-up-form';
import { TermsText } from '@/features/auth/components/common/terms-text';

export default async function SignUpPage() {
  const t = await getTranslations();

  return (
    <>
      <AuthHeader title={t('auth.createAccount')} description={t('auth.enterEmailToCreate')} />

      <div className="grid gap-6">
        <SignUpForm />
        <OAuthSection mode="signUp" />
      </div>

      <TermsText />
    </>
  );
}
