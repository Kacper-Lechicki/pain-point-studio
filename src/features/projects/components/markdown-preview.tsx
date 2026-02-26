'use client';

import type { Components } from 'react-markdown';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const components: Components = {
  h1: ({ children }) => (
    <h1 className="text-foreground mt-6 mb-3 text-2xl leading-tight font-bold first:mt-0">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-foreground mt-6 mb-3 text-[22px] leading-tight font-semibold first:mt-0">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-foreground mt-5 mb-2 text-lg leading-tight font-semibold">{children}</h3>
  ),
  h4: ({ children }) => (
    <h4 className="text-foreground mt-4 mb-2 text-base leading-tight font-semibold">{children}</h4>
  ),
  p: ({ children }) => (
    <p className="text-foreground mb-3 text-[15px] leading-relaxed last:mb-0">{children}</p>
  ),
  ul: ({ children }) => (
    <ul className="text-foreground mb-3 list-disc pl-7 text-[15px] leading-relaxed">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="text-foreground mb-3 list-decimal pl-7 text-[15px] leading-relaxed">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="mb-1">{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className="text-muted-foreground border-border my-3 border-l-[3px] pl-4 italic">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="border-border my-6" />,
  a: ({ href, children }) => (
    <a
      href={href}
      className="text-primary underline underline-offset-4"
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  ),
  code: ({ children, className }) => {
    const isBlock = className?.includes('language-');

    if (isBlock) {
      return <code className="bg-muted block rounded-md px-4 py-3 text-sm">{children}</code>;
    }

    return <code className="bg-muted rounded px-1.5 py-0.5 text-sm">{children}</code>;
  },
  pre: ({ children }) => <pre className="my-3 overflow-x-auto">{children}</pre>,
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  table: ({ children }) => (
    <div className="my-3 overflow-x-auto">
      <table className="border-border w-full border-collapse border text-sm">{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th className="bg-muted border-border border px-3 py-2 text-left font-semibold">{children}</th>
  ),
  td: ({ children }) => <td className="border-border border px-3 py-2">{children}</td>,
};

interface MarkdownPreviewProps {
  content: string;
}

export function MarkdownPreview({ content }: MarkdownPreviewProps) {
  return (
    <div className="min-h-[400px]">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
