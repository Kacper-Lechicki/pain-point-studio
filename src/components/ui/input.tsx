import * as React from 'react';

import { type VariantProps, cva } from 'class-variance-authority';

import { FORM_CONTROL_SIZES } from '@/components/ui/form-variants';
import { cn } from '@/lib/common/utils';

const inputVariants = cva(
  'file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input w-full min-w-0 rounded-md border bg-transparent px-3 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
  {
    variants: {
      size: {
        default: `${FORM_CONTROL_SIZES.default} py-2`,
        md: `${FORM_CONTROL_SIZES.md} py-1`,
        sm: `${FORM_CONTROL_SIZES.sm} py-1 text-sm`,
      },
    },
    defaultVariants: {
      size: 'default',
    },
  }
);

type InputProps = Omit<React.ComponentProps<'input'>, 'size'> & VariantProps<typeof inputVariants>;

function Input({ className, type, size, ...props }: InputProps) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(inputVariants({ size, className }))}
      {...props}
      suppressHydrationWarning
    />
  );
}

export { Input, inputVariants };
