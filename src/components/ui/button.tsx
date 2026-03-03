import * as React from 'react';

import { type VariantProps, cva } from 'class-variance-authority';
import { Slot } from 'radix-ui';

import { FORM_CONTROL_SIZES } from '@/components/ui/form-variants';
import { cn } from '@/lib/common/utils';

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground md:hover:bg-primary/90',
        destructive:
          'bg-destructive text-white md:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60',
        warning:
          'bg-[var(--color-warning)] text-[var(--color-warning-foreground)] md:hover:opacity-90 focus-visible:ring-[var(--color-warning)]/30 dark:focus-visible:ring-[var(--color-warning)]/40',
        accent:
          'bg-violet-600 text-white md:hover:bg-violet-600/90 focus-visible:ring-violet-500/20 dark:focus-visible:ring-violet-500/40 dark:bg-violet-500 dark:md:hover:bg-violet-500/90',
        success:
          'bg-emerald-600 text-white md:hover:bg-emerald-600/90 focus-visible:ring-emerald-500/20 dark:focus-visible:ring-emerald-500/40 dark:bg-emerald-500 dark:md:hover:bg-emerald-500/90',
        outline:
          'border bg-background shadow-xs md:hover:bg-accent md:hover:text-foreground dark:bg-input/30 dark:border-input dark:md:hover:bg-input/50',
        secondary: 'bg-secondary text-secondary-foreground md:hover:bg-secondary/80',
        ghost:
          'border border-dashed border-transparent md:hover:border-foreground/30 md:hover:text-foreground focus-visible:border-transparent',
        ghostDestructive:
          'text-destructive border border-dashed border-transparent md:hover:border-destructive/30 focus-visible:border-transparent',
        link: 'text-primary underline-offset-4 md:hover:underline',
      },
      size: {
        default: `${FORM_CONTROL_SIZES.default} rounded-md px-6 has-[>svg]:px-4`,
        md: `${FORM_CONTROL_SIZES.md} px-4 py-2 has-[>svg]:px-3`,
        sm: `${FORM_CONTROL_SIZES.sm} rounded-md gap-1.5 px-3 has-[>svg]:px-2.5`,
        xs: "h-6 gap-1 rounded-md px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
        icon: 'size-10 md:size-9',
        'icon-md': 'size-9',
        'icon-sm': 'size-8',
        'icon-xs': "size-6 rounded-md [&_svg:not([class*='size-'])]:size-3",
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

interface ButtonProps extends React.ComponentProps<'button'>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

function Button({
  className,
  variant = 'default',
  size = 'default',
  asChild = false,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot.Root : 'button';

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
