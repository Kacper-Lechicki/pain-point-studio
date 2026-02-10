'use client';

import { ErrorPage } from '@/components/common/error-page';
import { ROUTES } from '@/config';

interface DashboardErrorProps {
  reset: () => void;
}

export default function DashboardError({ reset }: DashboardErrorProps) {
  return (
    <ErrorPage reset={reset} backHref={ROUTES.common.dashboard} backLabelKey="backToDashboard" />
  );
}
