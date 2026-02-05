import { getTranslations } from 'next-intl/server';

import { AuthHeader } from '@/features/auth/components/auth-header';
import { ForgotPasswordForm } from '@/features/auth/components/forgot-password-form';

export default async function ForgotPasswordPage() {
  const t = await getTranslations();

  return (
    <>
      <AuthHeader title={t('auth.resetPassword')} description={t('auth.enterEmailToReset')} />
      <ForgotPasswordForm />
    </>
  );
}
