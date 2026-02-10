import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getInitials(name: string, fallback: string): string {
  if (!name) {
    return fallback.slice(0, 2).toUpperCase();
  }

  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

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
