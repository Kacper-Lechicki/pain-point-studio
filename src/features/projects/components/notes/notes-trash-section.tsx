'use client';

import { useCallback, useState } from 'react';

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
import { NoteListItem } from '@/features/projects/components/notes/note-list-item';
import { NotesSection } from '@/features/projects/components/notes/notes-section';
import type { ProjectNoteMeta } from '@/features/projects/types';

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
          <NoteListItem
            key={note.id}
            note={note}
            isSelected={selectedNoteId === note.id}
            onClick={onSelectNote}
            className="opacity-60"
            menuSlot={
              !isArchived ? (
                <TrashNoteMenu
                  noteId={note.id}
                  onRestore={onRestore}
                  onDelete={setConfirmDeleteId}
                />
              ) : undefined
            }
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

interface TrashNoteMenuProps {
  noteId: string;
  onRestore: (noteId: string) => void;
  onDelete: (noteId: string) => void;
}

function TrashNoteMenu({ noteId, onRestore, onDelete }: TrashNoteMenuProps) {
  const t = useTranslations('projects.detail.notes');

  return (
    <DropdownMenu>
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
        <DropdownMenuItem onClick={() => onRestore(noteId)}>
          <RotateCcw className="size-4" />
          {t('restore')}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={() => onDelete(noteId)}>
          <Trash2 className="size-4" />
          {t('permanentlyDelete')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
