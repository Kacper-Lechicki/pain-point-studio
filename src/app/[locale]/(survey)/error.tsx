'use client';

import { ErrorPage } from '@/components/common/error-page';
import { ROUTES } from '@/config';

interface SurveyErrorProps {
  reset: () => void;
}

export default function SurveyError({ reset }: SurveyErrorProps) {
  return <ErrorPage reset={reset} backHref={ROUTES.common.home} backLabelKey="backToHome" />;
}
