'use client';

import { type KeyboardEvent, useEffect, useRef, useState } from 'react';

import type { Editor } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import {
  ArrowLeft,
  Bold,
  Check,
  Code,
  Italic,
  Link,
  Strikethrough,
  Underline,
  X,
} from 'lucide-react';

type ToolbarMode = 'formatting' | 'link-input';

interface BubbleToolbarProps {
  editor: Editor;
}

function ToolbarButton({
  icon: Icon,
  isActive,
  onClick,
  title,
}: {
  icon: React.ComponentType<{ className?: string }>;
  isActive?: boolean;
  onClick: () => void;
  title: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`flex size-7 items-center justify-center rounded-md transition-colors ${
        isActive
          ? 'bg-secondary text-foreground'
          : 'text-muted-foreground md:hover:bg-secondary md:hover:text-foreground'
      }`}
    >
      <Icon className="size-3.5" />
    </button>
  );
}

function ToolbarSeparator() {
  return <div className="bg-border mx-0.5 h-4 w-px" />;
}

function LinkInput({ editor, onBack }: { editor: Editor; onBack: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState(() => {
    return (editor.getAttributes('link').href as string) ?? '';
  });

  useEffect(() => {
    requestAnimationFrame(() => inputRef.current?.focus());
  }, []);

  function applyLink() {
    const trimmed = url.trim();

    if (trimmed) {
      editor.chain().focus().extendMarkRange('link').setLink({ href: trimmed }).run();
    } else {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
    }

    onBack();
  }

  function removeLink() {
    editor.chain().focus().extendMarkRange('link').unsetLink().run();
    onBack();
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      applyLink();
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      onBack();
    }
  }

  return (
    <div className="flex items-center gap-0.5">
      <ToolbarButton icon={ArrowLeft} onClick={onBack} title="Back" />
      <ToolbarSeparator />
      <input
        ref={inputRef}
        type="url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Paste link..."
        className="h-7 w-40 border-none bg-transparent px-1.5 text-xs outline-none"
      />
      <ToolbarButton icon={Check} onClick={applyLink} title="Apply link" />
      {editor.isActive('link') && (
        <ToolbarButton icon={X} onClick={removeLink} title="Remove link" />
      )}
    </div>
  );
}

export function BubbleToolbar({ editor }: BubbleToolbarProps) {
  const [mode, setMode] = useState<ToolbarMode>('formatting');

  useEffect(() => {
    const handler = () => setMode('formatting');

    editor.on('selectionUpdate', handler);

    return () => {
      editor.off('selectionUpdate', handler);
    };
  }, [editor]);

  return (
    <BubbleMenu
      editor={editor}
      options={{
        placement: 'top',
        offset: 8,
      }}
    >
      <div className="bg-popover text-popover-foreground flex items-center gap-0.5 rounded-md border p-1 shadow-md">
        {mode === 'formatting' ? (
          <>
            <ToolbarButton
              icon={Bold}
              isActive={editor.isActive('bold')}
              onClick={() => editor.chain().focus().toggleBold().run()}
              title="Bold"
            />
            <ToolbarButton
              icon={Italic}
              isActive={editor.isActive('italic')}
              onClick={() => editor.chain().focus().toggleItalic().run()}
              title="Italic"
            />
            <ToolbarButton
              icon={Strikethrough}
              isActive={editor.isActive('strike')}
              onClick={() => editor.chain().focus().toggleStrike().run()}
              title="Strikethrough"
            />
            <ToolbarButton
              icon={Underline}
              isActive={editor.isActive('underline')}
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              title="Underline"
            />

            <ToolbarSeparator />

            <ToolbarButton
              icon={Code}
              isActive={editor.isActive('code')}
              onClick={() => editor.chain().focus().toggleCode().run()}
              title="Inline code"
            />
            <ToolbarButton
              icon={Link}
              isActive={editor.isActive('link')}
              onClick={() => setMode('link-input')}
              title="Link"
            />
          </>
        ) : (
          <LinkInput editor={editor} onBack={() => setMode('formatting')} />
        )}
      </div>
    </BubbleMenu>
  );
}
