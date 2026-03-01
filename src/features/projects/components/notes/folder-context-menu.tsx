'use client';

import { useCallback, useState } from 'react';

import { Pencil, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface FolderContextMenuProps {
  children: React.ReactNode;
  onRename: () => void;
  onDelete: () => void;
}

export function FolderContextMenu({ children, onRename, onDelete }: FolderContextMenuProps) {
  const t = useTranslations('projects.detail.notes');
  const [open, setOpen] = useState(false);

  const handleRename = useCallback(() => {
    onRename();
    setOpen(false);
  }, [onRename]);

  const handleDelete = useCallback(() => {
    onDelete();
    setOpen(false);
  }, [onDelete]);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem onClick={handleRename}>
          <Pencil className="size-4" />
          {t('renameFolder')}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem variant="destructive" onClick={handleDelete}>
          <Trash2 className="size-4" />
          {t('deleteFolder')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
