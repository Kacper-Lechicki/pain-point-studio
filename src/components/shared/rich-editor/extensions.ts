import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import type { Extensions } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

import { SlashCommands } from '@/components/shared/rich-editor/slash-commands';

interface ExtensionOptions {
  placeholder?: string | undefined;
}

export function createExtensions({ placeholder }: ExtensionOptions = {}): Extensions {
  return [
    StarterKit.configure({
      heading: { levels: [1, 2, 3] },
      link: {
        openOnClick: false,
        autolink: true,
        HTMLAttributes: {
          rel: 'noopener noreferrer',
          target: '_blank',
        },
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
