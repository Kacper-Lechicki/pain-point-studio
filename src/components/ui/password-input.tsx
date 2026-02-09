'use client';

import * as React from 'react';

import { type VariantProps } from 'class-variance-authority';
import { Eye, EyeOff } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input, inputVariants } from '@/components/ui/input';
import { cn } from '@/lib/common/utils';

type PasswordInputProps = Omit<React.ComponentProps<typeof Input>, 'type'> &
  VariantProps<typeof inputVariants> & {
    showPasswordLabel?: string;
    hidePasswordLabel?: string;
  };

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  (
    {
      className,
      size,
      showPasswordLabel = 'Show password',
      hidePasswordLabel = 'Hide password',
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = React.useState(false);

    const togglePassword = () => setShowPassword((prev) => !prev);

    return (
      <div className="relative">
        <Input
          type={showPassword ? 'text' : 'password'}
          size={size}
          className={cn('pr-10', className)}
          ref={ref}
          {...props}
        />

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="text-muted-foreground absolute top-0 right-0 h-full px-3 md:hover:bg-transparent"
          onClick={togglePassword}
          aria-label={showPassword ? hidePasswordLabel : showPasswordLabel}
        >
          {showPassword ? (
            <EyeOff className="size-4" aria-hidden="true" />
          ) : (
            <Eye className="size-4" aria-hidden="true" />
          )}
        </Button>
      </div>
    );
  }
);

PasswordInput.displayName = 'PasswordInput';

export { PasswordInput };
