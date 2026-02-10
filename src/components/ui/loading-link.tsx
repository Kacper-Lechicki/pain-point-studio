'use client';

import { type ComponentProps, type ReactNode, useTransition } from 'react';

import { Spinner } from '@/components/ui/spinner';
import { type AppRoute } from '@/config/routes';
import { useRouter } from '@/i18n/routing';

interface LoadingLinkProps extends Omit<ComponentProps<'button'>, 'onClick'> {
  href: AppRoute;
  icon?: ReactNode;
  onClick?: () => void;
  children: ReactNode;
}

const LoadingLink = ({ href, icon, onClick, children, disabled, ...props }: LoadingLinkProps) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const isDisabled = disabled || isPending;

  const handleClick = () => {
    if (isDisabled) {
      return;
    }

    onClick?.();
    startTransition(() => {
      router.push(href);
    });
  };

  return (
    <button type="button" disabled={isDisabled} onClick={handleClick} {...props}>
      {isPending ? <Spinner /> : icon}
      {children}
    </button>
  );
};

export { LoadingLink };
