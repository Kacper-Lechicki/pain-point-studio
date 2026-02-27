import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import type { Extensions } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

import { SlashCommands } from './slash-commands';

interface ExtensionOptions {
  placeholder?: string | undefined;
}

export function createExtensions({ placeholder }: ExtensionOptions = {}): Extensions {
  return [
    StarterKit.configure({
      heading: { levels: [1, 2, 3] },
      // StarterKit bundles: Document, Paragraph, Text, Bold, Italic,
      // Strike, BulletList, OrderedList, ListItem, Blockquote,
      // CodeBlock, HorizontalRule, History (undo/redo), Dropcursor, Gapcursor
    }),

    Underline,

    Link.configure({
      openOnClick: false,
      autolink: true,
      HTMLAttributes: {
        rel: 'noopener noreferrer',
        target: '_blank',
      },
    }),

    Image.configure({
      inline: false,
      allowBase64: false,
    }),

    Placeholder.configure({
      placeholder: placeholder ?? 'Type / for commands...',
      emptyEditorClass: 'is-editor-empty',
    }),

    SlashCommands,
  ];
}
