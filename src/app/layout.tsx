import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';

import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';

import { ScrollToTop } from '@/components/ui/scroll-to-top';
import '@/lib/env';

import './globals.css';

const inter = Inter({
  variable: '--font-sans',
  subsets: ['latin'],
});

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Pain Point Studio',
  description:
    'Validate product ideas before writing code. A structured research platform for developers to uncover real user pain points.',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} className="dark" data-scroll-behavior="smooth">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} flex min-h-screen flex-col antialiased`}
      >
        <ScrollToTop />
        <NextIntlClientProvider messages={messages}>
          <div className="flex-1">{children}</div>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
