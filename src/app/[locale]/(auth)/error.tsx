'use client';

import { ErrorPage } from '@/components/common/error-page';
import { ROUTES } from '@/config';

interface AuthErrorProps {
  reset: () => void;
}

export default function AuthError({ reset }: AuthErrorProps) {
  return <ErrorPage reset={reset} backHref={ROUTES.auth.signIn} backLabelKey="backToSignIn" />;
}
