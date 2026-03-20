import { Mail } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

import { PageTransition } from '@/components/ui/page-transition';
import { getPageMetadata } from '@/config';
import { AuthHeader } from '@/features/auth/components/common/auth-header';
import { ForgotPasswordForm } from '@/features/auth/components/common/forgot-password-form';

export async function generateMetadata() {
  const t = await getTranslations();

  return getPageMetadata(t, 'forgotPassword');
}

export default async function ForgotPasswordPage() {
  const t = await getTranslations();

  return (
    <PageTransition>
      <ForgotPasswordForm
        header={
          <AuthHeader
            icon={Mail}
            title={t('auth.resetPassword')}
            description={t('auth.enterEmailToReset')}
          />
        }
      />
    </PageTransition>
  );
}
