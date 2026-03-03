'use client';

import { ErrorPage } from '@/components/common/error-page';
import { ROUTES } from '@/config';

interface LocaleErrorProps {
  reset: () => void;
}

export default function LocaleError({ reset }: LocaleErrorProps) {
  return <ErrorPage reset={reset} backHref={ROUTES.common.home} backLabelKey="backToHome" />;
}
