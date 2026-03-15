import type { Viewport } from 'next';
import { Inter, JetBrains_Mono, Source_Serif_4 } from 'next/font/google';

import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages, getTranslations } from 'next-intl/server';

import { ScrollToTop } from '@/components/ui/scroll-to-top';
import { Toaster } from '@/components/ui/sonner';
import { getAppMetadata } from '@/config';
import '@/lib/common/env';

import './globals.css';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f3f4f6' },
    { media: '(prefers-color-scheme: dark)', color: '#101216' },
  ],
};

const inter = Inter({
  variable: '--font-sans',
  subsets: ['latin'],
  display: 'optional',
});

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
  display: 'optional',
});

const sourceSerif4 = Source_Serif_4({
  variable: '--font-serif',
  subsets: ['latin'],
  display: 'optional',
});

export async function generateMetadata() {
  const t = await getTranslations();

  return getAppMetadata(t);
}

interface RootLayoutProps {
  children: React.ReactNode;
}

export default async function RootLayout({ children }: Readonly<RootLayoutProps>) {
  const locale = await getLocale();
  const [messages, t] = await Promise.all([getMessages(), getTranslations()]);

  return (
    <html lang={locale} className="dark" data-scroll-behavior="smooth">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} ${sourceSerif4.variable} flex min-h-screen flex-col antialiased`}
      >
        <ScrollToTop />

        <a
          href="#main-content"
          className="bg-background text-foreground ring-ring sr-only z-[100] rounded-md px-4 py-2 font-medium focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:ring-2"
        >
          {t('common.skipToContent')}
        </a>

        <NextIntlClientProvider messages={messages}>
          <div className="flex-1">{children}</div>
          <Toaster />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
