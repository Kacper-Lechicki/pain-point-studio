import { UserPlus } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

import { PageTransition } from '@/components/ui/page-transition';
import { ROUTES } from '@/config';
import { AuthHeader } from '@/features/auth/components/common/auth-header';
import { OAuthLinks } from '@/features/auth/components/common/oauth-links';
import { SignUpForm } from '@/features/auth/components/common/sign-up-form';
import { TermsText } from '@/features/auth/components/common/terms-text';

export default async function SignUpPage() {
  const t = await getTranslations();

  return (
    <PageTransition>
      <SignUpForm
        header={
          <AuthHeader
            icon={UserPlus}
            title={t('auth.createAccount')}
            description={t('auth.alreadyHaveAccount')}
            linkText={t('auth.signIn')}
            linkHref={ROUTES.auth.signIn}
          />
        }
      >
        <OAuthLinks />
        <TermsText />
      </SignUpForm>
    </PageTransition>
  );
}
