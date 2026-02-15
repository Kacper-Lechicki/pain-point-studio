/**
 * Shared utilities: cn (Tailwind class merge), getInitials (avatar/display),
 * proxyImageUrl (Next.js image optimization for external URLs).
 */
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Merges class names with clsx and resolves Tailwind conflicts via tailwind-merge. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** First letters of each word, max 2, uppercase. Uses fallback when name is empty or whitespace-only. */
export function getInitials(name: string, fallback: string): string {
  if (!name?.trim()) {
    return fallback.slice(0, 2).toUpperCase();
  }

  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part: string) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/** Returns Next.js image loader URL for external images; localhost/127.0.0.1 and invalid URLs are returned as-is. */
export function proxyImageUrl(
  url: string | undefined,
  width = 384,
  quality = 75
): string | undefined {
  if (!url) {
    return undefined;
  }

  try {
    const parsed = new URL(url, 'http://localhost');

    if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') {
      return url;
    }

    return `/_next/image?url=${encodeURIComponent(url)}&w=${width}&q=${quality}`;
  } catch {
    return url;
  }
}
