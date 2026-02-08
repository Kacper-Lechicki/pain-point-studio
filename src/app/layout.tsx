import { Inter, JetBrains_Mono } from 'next/font/google';

import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages, getTranslations } from 'next-intl/server';

import { AccentInit } from '@/components/common/accent-init';
import { ScrollToTop } from '@/components/ui/scroll-to-top';
import { Toaster } from '@/components/ui/sonner';
import { getAppMetadata } from '@/config';
import '@/lib/common/env';

import './globals.css';

const inter = Inter({
  variable: '--font-sans',
  subsets: ['latin'],
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
  display: 'swap',
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
  const messages = await getMessages();

  return (
    <html lang={locale} className="dark" data-scroll-behavior="smooth">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} flex min-h-screen flex-col antialiased`}
      >
        <AccentInit />
        <ScrollToTop />

        <NextIntlClientProvider messages={messages}>
          <div className="flex-1">{children}</div>
          <Toaster />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
