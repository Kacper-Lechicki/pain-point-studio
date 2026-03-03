'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { EditorContent, type JSONContent, useEditor } from '@tiptap/react';

import { BubbleToolbar } from '@/components/shared/rich-editor/bubble-toolbar';
import { createExtensions } from '@/components/shared/rich-editor/extensions';
import { ImageUrlPrompt } from '@/components/shared/rich-editor/image-url-prompt';
import { setImageRequestCallback } from '@/components/shared/rich-editor/slash-commands';
import { cn } from '@/lib/common/utils';

import './editor.css';

interface RichEditorProps {
  content?: JSONContent | null;
  onChange?: (json: JSONContent) => void;
  placeholder?: string;
  editable?: boolean;
  className?: string;
  autoFocus?: boolean;
  showHint?: boolean;
  fillHeight?: boolean;
}

export function RichEditor({
  content,
  onChange,
  placeholder,
  editable = true,
  className,
  autoFocus = false,
  showHint = false,
  fillHeight = false,
}: RichEditorProps) {
  const [imagePrompt, setImagePrompt] = useState<{ top: number; left: number } | null>(null);
  const editorRef = useRef<ReturnType<typeof useEditor>>(null);

  const editor = useEditor({
    extensions: createExtensions({ placeholder }),
    content: content ?? null,
    editable,
    autofocus: autoFocus ? 'end' : false,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'tiptap',
        role: 'textbox',
        'aria-label': placeholder ?? 'Rich text editor',
        'aria-multiline': 'true',
      },
    },
    onUpdate: ({ editor: ed }) => {
      onChange?.(ed.getJSON());
    },
  });

  useEffect(() => {
    editorRef.current = editor;
  }, [editor]);

  useEffect(() => {
    setImageRequestCallback(() => {
      const ed = editorRef.current;

      if (!ed) {
        return;
      }

      const pos = ed.state.selection.$head.pos;
      const coords = ed.view.coordsAtPos(pos);

      setImagePrompt({
        top: coords.bottom + 8,
        left: coords.left,
      });
    });

    return () => {
      setImageRequestCallback(null);
    };
  }, []);

  useEffect(() => {
    if (editor && editor.isEditable !== editable) {
      editor.setEditable(editable);
    }
  }, [editor, editable]);

  const handleImageConfirm = useCallback(
    (url: string) => {
      editor?.chain().focus().setImage({ src: url }).run();
      setImagePrompt(null);
    },
    [editor]
  );

  const handleImageCancel = useCallback(() => {
    setImagePrompt(null);
    editor?.chain().focus().run();
  }, [editor]);

  if (!editor) {
    return null;
  }

  return (
    <div
      className={cn(
        'border-input bg-background relative rounded-md border shadow-xs transition-[color,box-shadow]',
        editable && 'focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px]',
        !editable && 'cursor-default',
        'dark:bg-input/30',
        fillHeight && 'rich-editor-fill flex min-h-0 flex-col',
        className
      )}
    >
      {editable && <BubbleToolbar editor={editor} />}

      <div
        className={cn(
          fillHeight && 'rich-editor-content flex min-h-0 flex-1 flex-col overflow-y-auto'
        )}
      >
        <EditorContent
          editor={editor}
          className={cn('px-4 py-3', fillHeight && 'flex min-h-0 flex-1 flex-col')}
        />
      </div>

      {editable && showHint && (
        <p className="text-muted-foreground border-input/50 border-t px-4 py-1.5 text-xs">
          Type <kbd className="bg-muted rounded px-1 py-0.5 font-mono text-[10px]">/</kbd> for
          commands · Supports Markdown
        </p>
      )}

      {imagePrompt && (
        <ImageUrlPrompt
          position={imagePrompt}
          onConfirm={handleImageConfirm}
          onCancel={handleImageCancel}
        />
      )}
    </div>
  );
}
