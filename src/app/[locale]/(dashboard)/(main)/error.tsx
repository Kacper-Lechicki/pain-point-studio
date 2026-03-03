'use client';

import { ErrorPage } from '@/components/common/error-page';
import { ROUTES } from '@/config';

interface MainErrorProps {
  reset: () => void;
}

export default function MainError({ reset }: MainErrorProps) {
  return (
    <ErrorPage reset={reset} backHref={ROUTES.common.dashboard} backLabelKey="backToDashboard" />
  );
}
