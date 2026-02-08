'use client';

import { useEffect } from 'react';

import { useRouter } from 'next/navigation';

import { ROUTES } from '@/config';

const NotFoundCatchAll = () => {
  const router = useRouter();

  useEffect(() => {
    router.replace(ROUTES.common.home);
  }, [router]);

  return null;
};

export default NotFoundCatchAll;
