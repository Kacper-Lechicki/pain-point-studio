/**
 * Public i18n routing API. App code should import Link, useRouter, usePathname,
 * redirect, and getPathname from here (@/i18n/routing), not from navigation or link directly.
 */
export {
  routing,
  BaseLink,
  redirect,
  usePathname,
  useRouter,
  getPathname,
} from '@/i18n/navigation';

export { default as Link } from '@/i18n/link';
