'use client';

import { ErrorPage } from '@/components/common/error-page';
import { ROUTES } from '@/config';

interface BuilderErrorProps {
  reset: () => void;
}

export default function BuilderError({ reset }: BuilderErrorProps) {
  return (
    <ErrorPage reset={reset} backHref={ROUTES.common.dashboard} backLabelKey="backToDashboard" />
  );
}
