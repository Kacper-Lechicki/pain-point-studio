'use client';

import { type Ref, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react';

import { type Editor, Extension, type Range } from '@tiptap/react';
import {
  type SuggestionKeyDownProps,
  type SuggestionOptions,
  type SuggestionProps,
} from '@tiptap/suggestion';
import Suggestion from '@tiptap/suggestion';
import {
  Code,
  Heading1,
  Heading2,
  Heading3,
  Image as ImageIcon,
  List,
  ListOrdered,
  Minus,
  Quote,
} from 'lucide-react';
import { type Root, createRoot } from 'react-dom/client';
import tippy, { type Instance as TippyInstance } from 'tippy.js';

import { cn } from '@/lib/common/utils';

interface SlashCommandItem {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  command: (props: { editor: Editor; range: Range }) => void;
}

let _imageRequestCallback: (() => void) | null = null;

export function setImageRequestCallback(cb: (() => void) | null) {
  _imageRequestCallback = cb;
}

const SLASH_COMMANDS: SlashCommandItem[] = [
  {
    title: 'Heading 1',
    description: 'Large section heading',
    icon: Heading1,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode('heading', { level: 1 }).run();
    },
  },
  {
    title: 'Heading 2',
    description: 'Medium section heading',
    icon: Heading2,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode('heading', { level: 2 }).run();
    },
  },
  {
    title: 'Heading 3',
    description: 'Small section heading',
    icon: Heading3,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode('heading', { level: 3 }).run();
    },
  },
  {
    title: 'Bullet List',
    description: 'Unordered bullet list',
    icon: List,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBulletList().run();
    },
  },
  {
    title: 'Numbered List',
    description: 'Ordered numbered list',
    icon: ListOrdered,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleOrderedList().run();
    },
  },
  {
    title: 'Quote',
    description: 'Block quote',
    icon: Quote,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBlockquote().run();
    },
  },
  {
    title: 'Code Block',
    description: 'Code with syntax',
    icon: Code,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleCodeBlock().run();
    },
  },
  {
    title: 'Divider',
    description: 'Horizontal separator',
    icon: Minus,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHorizontalRule().run();
    },
  },
  {
    title: 'Image',
    description: 'Insert image from URL',
    icon: ImageIcon,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).run();
      _imageRequestCallback?.();
    },
  },
];

interface SlashCommandListRef {
  onKeyDown: (props: SuggestionKeyDownProps) => boolean;
}

interface SlashCommandListProps {
  items: SlashCommandItem[];
  command: (item: SlashCommandItem) => void;
  ref?: Ref<SlashCommandListRef>;
}

function SlashCommandList({ items, command, ref }: SlashCommandListProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    const selected = container.querySelector('[data-active="true"]');

    if (selected) {
      selected.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  const upHandler = () => {
    setSelectedIndex((prev) => (prev + items.length - 1) % items.length);
  };

  const downHandler = () => {
    setSelectedIndex((prev) => (prev + 1) % items.length);
  };

  const enterHandler = () => {
    const item = items[selectedIndex];

    if (item) {
      command(item);
    }
  };

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: SuggestionKeyDownProps) => {
      if (event.key === 'ArrowUp') {
        upHandler();

        return true;
      }

      if (event.key === 'ArrowDown') {
        downHandler();

        return true;
      }

      if (event.key === 'Enter') {
        enterHandler();

        return true;
      }

      return false;
    },
  }));

  if (items.length === 0) {
    return (
      <div className="bg-popover text-popover-foreground rounded-md border p-1 shadow-md">
        <p className="text-muted-foreground py-6 text-center text-sm">No results</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="bg-popover text-popover-foreground z-50 max-h-[280px] overflow-y-auto rounded-md border p-1 shadow-md"
    >
      {items.map((item, index) => {
        const Icon = item.icon;
        const isActive = index === selectedIndex;

        return (
          <button
            key={item.title}
            type="button"
            data-active={isActive}
            className={cn(
              'flex min-h-10 w-full cursor-pointer items-center gap-2 rounded-lg border border-dashed border-transparent px-2 py-1.5 text-left text-sm transition-colors md:min-h-9',
              isActive
                ? 'border-foreground/30 text-foreground'
                : 'md:hover:border-foreground/30 md:hover:text-foreground'
            )}
            onClick={() => command(item)}
            onMouseEnter={() => setSelectedIndex(index)}
          >
            <Icon
              className={cn(
                'size-4 shrink-0',
                isActive ? 'text-foreground' : 'text-muted-foreground'
              )}
            />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{item.title}</p>
              <p className="text-muted-foreground truncate text-xs">{item.description}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function createSuggestionRenderer(): ReturnType<
  NonNullable<SuggestionOptions<SlashCommandItem>['render']>
> {
  let reactRoot: Root | null = null;
  let tippyInstance: TippyInstance | null = null;
  let listRef: SlashCommandListRef | null = null;

  return {
    onStart(props: SuggestionProps<SlashCommandItem>) {
      const el = document.createElement('div');

      reactRoot = createRoot(el);
      reactRoot.render(
        <SlashCommandList
          key={props.query}
          ref={(r) => {
            listRef = r;
          }}
          items={props.items}
          command={(item) => {
            props.command(item);
          }}
        />
      );

      if (!props.clientRect) {
        return;
      }

      tippyInstance = tippy(document.body, {
        getReferenceClientRect: props.clientRect as () => DOMRect,
        appendTo: () => document.body,
        content: el,
        showOnCreate: true,
        interactive: true,
        trigger: 'manual',
        placement: 'bottom-start',
        animation: false,
        maxWidth: 'none',
      });
    },

    onUpdate(props: SuggestionProps<SlashCommandItem>) {
      if (!reactRoot) {
        return;
      }

      reactRoot.render(
        <SlashCommandList
          key={props.query}
          ref={(r) => {
            listRef = r;
          }}
          items={props.items}
          command={(item) => {
            props.command(item);
          }}
        />
      );

      if (tippyInstance && props.clientRect) {
        tippyInstance.setProps({
          getReferenceClientRect: props.clientRect as () => DOMRect,
        });
      }
    },

    onKeyDown(props: SuggestionKeyDownProps) {
      if (props.event.key === 'Escape') {
        tippyInstance?.hide();

        return true;
      }

      return listRef?.onKeyDown(props) ?? false;
    },

    onExit() {
      tippyInstance?.destroy();
      tippyInstance = null;

      if (reactRoot) {
        const root = reactRoot;

        reactRoot = null;
        setTimeout(() => root.unmount(), 0);
      }

      listRef = null;
    },
  };
}

export const SlashCommands = Extension.create({
  name: 'slashCommands',

  addProseMirrorPlugins() {
    return [
      Suggestion<SlashCommandItem>({
        editor: this.editor,
        char: '/',
        allowSpaces: false,
        startOfLine: false,
        allowedPrefixes: [' ', '\n', null] as unknown as string[],

        items: ({ query }) => {
          const q = query.toLowerCase();

          return SLASH_COMMANDS.filter(
            (item) =>
              item.title.toLowerCase().includes(q) || item.description.toLowerCase().includes(q)
          );
        },

        command: ({ editor, range, props: item }) => {
          item.command({ editor, range });
        },

        render: createSuggestionRenderer,
      }),
    ];
  },
});
