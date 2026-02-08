import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Routes an external image URL through Next.js Image Optimization (`/_next/image`)
 * to avoid third-party cookies (e.g. Google avatar URLs from `lh3.googleusercontent.com`).
 * Local/relative URLs are returned unchanged.
 */
export function proxyImageUrl(
  url: string | undefined,
  width = 256,
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
