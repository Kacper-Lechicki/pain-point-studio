export interface TextSegment {
  text: string;
  highlight: boolean;
}

export function buildHighlightRegex(words: string[]): RegExp | null {
  if (words.length === 0) {
    return null;
  }

  const escaped = words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

  return new RegExp(`\\b(${escaped.join('|')})\\b`, 'gi');
}

export function highlightText(text: string, regex: RegExp | null): TextSegment[] {
  if (!regex) {
    return [{ text, highlight: false }];
  }

  const segments: TextSegment[] = [];

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  regex.lastIndex = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ text: text.slice(lastIndex, match.index), highlight: false });
    }

    segments.push({ text: match[0], highlight: true });
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    segments.push({ text: text.slice(lastIndex), highlight: false });
  }

  return segments.length > 0 ? segments : [{ text, highlight: false }];
}
