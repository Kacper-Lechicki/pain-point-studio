'use client';

import { useTranslations } from 'next-intl';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Spinner } from '@/components/ui/spinner';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'destructive' | 'warning' | 'accent' | 'success';
  /** Show a loading spinner on the confirm button and disable interaction. */
  isLoading?: boolean;
}

const ConfirmDialog = ({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  confirmLabel,
  cancelLabel,
  variant = 'destructive',
  isLoading = false,
}: ConfirmDialogProps) => {
  const t = useTranslations();

  return (
    <AlertDialog open={open} onOpenChange={isLoading ? () => {} : onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title ?? t('common.confirm.title')}</AlertDialogTitle>

          <AlertDialogDescription>
            {description ?? t('common.confirm.description')}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel variant="outline" disabled={isLoading}>
            {cancelLabel ?? t('common.cancel')}
          </AlertDialogCancel>

          <AlertDialogAction variant={variant} onClick={onConfirm} disabled={isLoading}>
            {isLoading && <Spinner className="size-4" />}
            {confirmLabel ?? t('common.confirm.action')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export { ConfirmDialog };
