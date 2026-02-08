import { getTranslations } from 'next-intl/server';

import { PageTransition } from '@/components/ui/page-transition';
import { AuthHeader } from '@/features/auth/components/common/auth-header';
import { UpdatePasswordForm } from '@/features/auth/components/common/update-password-form';

export default async function UpdatePasswordPage() {
  const t = await getTranslations();

  return (
    <PageTransition>
      <AuthHeader title={t('auth.setNewPassword')} description={t('auth.enterNewPassword')} />
      <UpdatePasswordForm />
    </PageTransition>
  );
}
