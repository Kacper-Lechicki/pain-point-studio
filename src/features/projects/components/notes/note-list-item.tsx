'use client';

import { useRef } from 'react';

import {
  Copy,
  FolderInput,
  FolderMinus,
  GripVertical,
  MoreVertical,
  Pin,
  PinOff,
  Trash2,
} from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { DragHandleProps } from '@/features/projects/components/notes/sortable-note-list';
import type { ProjectNoteFolder, ProjectNoteMeta } from '@/features/projects/types';
import { cn } from '@/lib/common/utils';

interface NoteListItemProps {
  note: ProjectNoteMeta;
  isSelected: boolean;
  isDragging?: boolean;
  dragHandleProps?: DragHandleProps | null;
  folders?: ProjectNoteFolder[];
  onClick: (noteId: string) => void;
  onPin?: (noteId: string, isPinned: boolean) => void;
  onDuplicate?: (noteId: string) => void;
  onMoveToFolder?: (noteId: string, folderId: string | null) => void;
  onDelete?: (noteId: string) => void;
  /** Additional CSS classes for the container (e.g. opacity-60 for trash items). */
  className?: string;
  /** Custom menu content. When provided, replaces the default dropdown menu. */
  menuSlot?: React.ReactNode;
}

export function NoteListItem({
  note,
  isSelected,
  isDragging = false,
  dragHandleProps,
  folders,
  onClick,
  onPin,
  onDuplicate,
  onMoveToFolder,
  onDelete,
  className,
  menuSlot,
}: NoteListItemProps) {
  const t = useTranslations('projects.detail.notes');
  const menuOpenRef = useRef(false);

  const displayTitle = note.title || t('untitled');
  const hasTitle = !!note.title;
  const dateStr = new Date(note.updated_at).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });

  const hasDefaultMenu = !menuSlot && !!onDelete;
  const availableFolders = folders?.filter((f) => f.id !== note.folder_id) ?? [];
  const isInFolder = !!note.folder_id;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => {
        if (!menuOpenRef.current) {
          onClick(note.id);
        }
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();

          if (!menuOpenRef.current) {
            onClick(note.id);
          }
        }
      }}
      className={cn(
        'group flex min-h-10 cursor-pointer items-center gap-1.5 border-l-2 pr-2.5 pl-2.5 text-sm transition-colors md:min-h-9',
        isSelected ? 'border-primary bg-accent/50' : 'md:hover:bg-accent/30 border-transparent',
        isDragging && 'opacity-50',
        className
      )}
    >
      {dragHandleProps ? (
        <span
          className="text-muted-foreground flex shrink-0 cursor-grab touch-none active:cursor-grabbing [.group:active_&]:cursor-grabbing"
          onPointerDown={(e) => {
            e.stopPropagation();
            e.preventDefault();
            dragHandleProps.onPointerDown(e);
            e.currentTarget.setPointerCapture(e.pointerId);
          }}
          role="button"
          tabIndex={-1}
        >
          <GripVertical className="size-4" aria-hidden />
        </span>
      ) : (
        <span className="size-4 shrink-0" />
      )}

      <span
        className={cn(
          'min-w-0 flex-1 truncate text-xs',
          hasTitle ? 'text-foreground' : 'text-muted-foreground italic'
        )}
      >
        {displayTitle}
      </span>

      <span className="text-muted-foreground shrink-0 text-xs">{dateStr}</span>

      {menuSlot}

      {hasDefaultMenu && (
        <DropdownMenu
          onOpenChange={(open) => {
            if (open) {
              menuOpenRef.current = true;
            } else {
              setTimeout(() => {
                menuOpenRef.current = false;
              }, 100);
            }
          }}
        >
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-xs"
              className="shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="size-3.5" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-48">
            {onPin && (
              <DropdownMenuItem onClick={() => onPin(note.id, !note.is_pinned)}>
                {note.is_pinned ? <PinOff className="size-4" /> : <Pin className="size-4" />}
                {note.is_pinned ? t('unpin') : t('pin')}
              </DropdownMenuItem>
            )}

            {onDuplicate && (
              <DropdownMenuItem onClick={() => onDuplicate(note.id)}>
                <Copy className="size-4" />
                {t('duplicate')}
              </DropdownMenuItem>
            )}

            {onMoveToFolder && availableFolders.length > 0 && (
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <FolderInput className="size-4" />
                  {t('moveToFolder')}
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  {availableFolders.map((folder) => (
                    <DropdownMenuItem
                      key={folder.id}
                      onClick={() => onMoveToFolder(note.id, folder.id)}
                    >
                      {folder.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            )}

            {onMoveToFolder && isInFolder && (
              <DropdownMenuItem onClick={() => onMoveToFolder(note.id, null)}>
                <FolderMinus className="size-4" />
                {t('removeFromFolder')}
              </DropdownMenuItem>
            )}

            <DropdownMenuSeparator />

            <DropdownMenuItem variant="destructive" onClick={() => onDelete(note.id)}>
              <Trash2 className="size-4" />
              {t('delete')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
