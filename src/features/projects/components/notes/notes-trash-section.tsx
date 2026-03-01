'use client';

import { useCallback, useRef, useState } from 'react';

import { MoreVertical, RotateCcw, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { ProjectNoteMeta } from '@/features/projects/types';
import { cn } from '@/lib/common/utils';

import { NotesSection } from './notes-section';

interface NotesTrashSectionProps {
  notes: ProjectNoteMeta[];
  isArchived: boolean;
  selectedNoteId: string | null;
  onSelectNote: (noteId: string) => void;
  onRestore: (noteId: string) => void;
  onPermanentlyDelete: (noteId: string) => void;
  onEmptyTrash: () => void;
}

export function NotesTrashSection({
  notes,
  isArchived,
  selectedNoteId,
  onSelectNote,
  onRestore,
  onPermanentlyDelete,
  onEmptyTrash,
}: NotesTrashSectionProps) {
  const t = useTranslations('projects.detail.notes');
  const [confirmEmptyOpen, setConfirmEmptyOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleEmptyTrash = useCallback(() => {
    onEmptyTrash();
    setConfirmEmptyOpen(false);
  }, [onEmptyTrash]);

  const handlePermanentlyDelete = useCallback(() => {
    if (confirmDeleteId) {
      onPermanentlyDelete(confirmDeleteId);
      setConfirmDeleteId(null);
    }
  }, [confirmDeleteId, onPermanentlyDelete]);

  return (
    <NotesSection
      title={t('trash')}
      {...(notes.length > 0 ? { count: notes.length } : {})}
      defaultExpanded={false}
      action={
        !isArchived && notes.length > 0 ? (
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => setConfirmEmptyOpen(true)}
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="size-3" />
          </Button>
        ) : undefined
      }
    >
      <div>
        {notes.map((note) => (
          <TrashNoteItem
            key={note.id}
            note={note}
            isSelected={selectedNoteId === note.id}
            isArchived={isArchived}
            onSelect={onSelectNote}
            onRestore={onRestore}
            onDelete={setConfirmDeleteId}
          />
        ))}
      </div>

      <ConfirmDialog
        open={confirmEmptyOpen}
        onOpenChange={setConfirmEmptyOpen}
        onConfirm={handleEmptyTrash}
        title={t('confirmEmptyTrash')}
        description={t('confirmEmptyTrashDescription')}
        variant="destructive"
      />

      <ConfirmDialog
        open={!!confirmDeleteId}
        onOpenChange={(open) => !open && setConfirmDeleteId(null)}
        onConfirm={handlePermanentlyDelete}
        title={t('confirmPermanentDelete')}
        description={t('confirmPermanentDeleteDescription')}
        variant="destructive"
      />
    </NotesSection>
  );
}

// ── Trash note item ─────────────────────────────────────────────

interface TrashNoteItemProps {
  note: ProjectNoteMeta;
  isSelected: boolean;
  isArchived: boolean;
  onSelect: (noteId: string) => void;
  onRestore: (noteId: string) => void;
  onDelete: (noteId: string) => void;
}

function TrashNoteItem({
  note,
  isSelected,
  isArchived,
  onSelect,
  onRestore,
  onDelete,
}: TrashNoteItemProps) {
  const t = useTranslations('projects.detail.notes');
  const menuOpenRef = useRef(false);

  const displayTitle = note.title || t('untitled');
  const hasTitle = !!note.title;
  const dateStr = new Date(note.updated_at).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => {
        if (!menuOpenRef.current) {
          onSelect(note.id);
        }
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();

          if (!menuOpenRef.current) {
            onSelect(note.id);
          }
        }
      }}
      className={cn(
        'group flex min-h-10 cursor-pointer items-center gap-2 border-l-2 pr-2 pl-4 text-sm opacity-60 transition-colors md:min-h-9',
        isSelected ? 'border-primary bg-accent/50' : 'hover:bg-accent/30 border-transparent'
      )}
    >
      <span
        className={cn(
          'min-w-0 flex-1 truncate text-xs',
          hasTitle ? 'text-foreground' : 'text-muted-foreground italic'
        )}
      >
        {displayTitle}
      </span>

      <span className="text-muted-foreground shrink-0 text-xs">{dateStr}</span>

      {!isArchived && (
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
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem onClick={() => onRestore(note.id)}>
              <RotateCcw className="size-4" />
              {t('restore')}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={() => onDelete(note.id)}>
              <Trash2 className="size-4" />
              {t('permanentlyDelete')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
