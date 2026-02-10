import { ComponentProps } from 'react';

import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

interface SubmitButtonProps extends Omit<ComponentProps<typeof Button>, 'type'> {
  isLoading: boolean;
}

const SubmitButton = ({ isLoading, children, disabled, ...props }: SubmitButtonProps) => {
  return (
    <Button type="submit" disabled={disabled || isLoading} {...props}>
      {isLoading && <Spinner />}
      {children}
    </Button>
  );
};

export { SubmitButton };
