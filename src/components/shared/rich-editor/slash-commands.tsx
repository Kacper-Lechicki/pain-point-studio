'use client';

import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';

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

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SlashCommandItem {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  command: (props: { editor: Editor; range: Range }) => void;
}

// ---------------------------------------------------------------------------
// Module-level callback for image request (avoids mutating editor.storage)
// ---------------------------------------------------------------------------

let _imageRequestCallback: (() => void) | null = null;

export function setImageRequestCallback(cb: (() => void) | null) {
  _imageRequestCallback = cb;
}

// ---------------------------------------------------------------------------
// Slash command definitions
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Slash Command List (React component rendered inside tippy)
// ---------------------------------------------------------------------------

interface SlashCommandListRef {
  onKeyDown: (props: SuggestionKeyDownProps) => boolean;
}

interface SlashCommandListProps {
  items: SlashCommandItem[];
  command: (item: SlashCommandItem) => void;
}

const SlashCommandList = forwardRef<SlashCommandListRef, SlashCommandListProps>(
  ({ items, command }, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);

    // Scroll selected item into view
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

    const upHandler = useCallback(() => {
      setSelectedIndex((prev) => (prev + items.length - 1) % items.length);
    }, [items.length]);

    const downHandler = useCallback(() => {
      setSelectedIndex((prev) => (prev + 1) % items.length);
    }, [items.length]);

    const enterHandler = useCallback(() => {
      const item = items[selectedIndex];

      if (item) {
        command(item);
      }
    }, [items, selectedIndex, command]);

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
        <div className="bg-popover text-popover-foreground rounded-md border p-2 shadow-md">
          <p className="text-muted-foreground px-2 py-1 text-sm">No results</p>
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
              className={`flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-left text-sm transition-colors ${
                isActive ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50'
              }`}
              onClick={() => command(item)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <div className="bg-muted flex size-8 shrink-0 items-center justify-center rounded-md">
                <Icon className="size-4" />
              </div>
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
);

SlashCommandList.displayName = 'SlashCommandList';

// ---------------------------------------------------------------------------
// Suggestion render (tippy.js + React 19 createRoot)
// ---------------------------------------------------------------------------

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

      // Defer unmount to avoid React warnings about synchronous unmount
      if (reactRoot) {
        const root = reactRoot;

        reactRoot = null;
        setTimeout(() => root.unmount(), 0);
      }

      listRef = null;
    },
  };
}

// ---------------------------------------------------------------------------
// Tiptap Extension
// ---------------------------------------------------------------------------

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
