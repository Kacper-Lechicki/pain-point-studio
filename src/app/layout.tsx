import { Inter, JetBrains_Mono } from 'next/font/google';

import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages, getTranslations } from 'next-intl/server';

import { ScrollToTop } from '@/components/ui/scroll-to-top';
import { Toaster } from '@/components/ui/sonner';
import { getAppMetadata } from '@/config/metadata';
import '@/lib/common/env';

import './globals.css';

const inter = Inter({
  variable: '--font-sans',
  subsets: ['latin'],
});

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
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
    <html lang={locale} className="dark" suppressHydrationWarning data-scroll-behavior="smooth">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} flex min-h-screen flex-col antialiased`}
      >
        <ScrollToTop />

        <NextIntlClientProvider messages={messages}>
          <div className="flex-1">{children}</div>
          <Toaster />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
