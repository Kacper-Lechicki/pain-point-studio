import { getTranslations } from 'next-intl/server';

import { PageTransition } from '@/components/ui/page-transition';
import { AuthHeader } from '@/features/auth/components/common/auth-header';
import { ForgotPasswordForm } from '@/features/auth/components/common/forgot-password-form';

export default async function ForgotPasswordPage() {
  const t = await getTranslations();

  return (
    <PageTransition>
      <ForgotPasswordForm
        header={
          <AuthHeader title={t('auth.resetPassword')} description={t('auth.enterEmailToReset')} />
        }
      />
    </PageTransition>
  );
}
