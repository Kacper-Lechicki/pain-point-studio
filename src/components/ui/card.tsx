import * as React from 'react';

import { cn } from '@/lib/common/utils';

type CardProps = React.ComponentProps<'div'>;
type CardHeaderProps = React.ComponentProps<'div'>;
type CardTitleProps = React.ComponentProps<'div'>;
type CardDescriptionProps = React.ComponentProps<'div'>;
type CardContentProps = React.ComponentProps<'div'>;

function Card({ className, ...props }: CardProps) {
  return (
    <div
      data-slot="card"
      className={cn(
        'bg-card text-card-foreground flex flex-col gap-6 rounded-lg border py-6 shadow-sm',
        className
      )}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: CardHeaderProps) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        '@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-2 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6',
        className
      )}
      {...props}
    />
  );
}

function CardTitle({ className, ...props }: CardTitleProps) {
  return (
    <div
      data-slot="card-title"
      className={cn('leading-none font-semibold', className)}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }: CardDescriptionProps) {
  return (
    <div
      data-slot="card-description"
      className={cn('text-muted-foreground text-xs', className)}
      {...props}
    />
  );
}

function CardContent({ className, ...props }: CardContentProps) {
  return <div data-slot="card-content" className={cn('px-6', className)} {...props} />;
}

export { Card, CardHeader, CardTitle, CardDescription, CardContent };
