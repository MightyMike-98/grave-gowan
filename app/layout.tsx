import type { Metadata } from 'next';
import { Inter, Cormorant_Garamond } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Analytics } from '@vercel/analytics/next';
import './globals.css';

const inter = Inter({
    subsets: ['latin'],
    variable: '--font-inter',
    display: 'swap',
    weight: ['300', '400', '500', '600'],
});

const cormorant = Cormorant_Garamond({
    subsets: ['latin'],
    variable: '--font-serif',
    display: 'swap',
    weight: ['300', '400', '500', '600'],
    style: ['normal', 'italic'],
});

export const metadata: Metadata = {
    title: 'MemorialYard - Honor Loved Ones',
    description: 'A quiet, respectful space to honor loved ones.',
    openGraph: {
        title: 'MemorialYard',
        description: 'A quiet, respectful space to honor loved ones.',
        type: 'website',
    },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
    const locale = await getLocale();
    const messages = await getMessages();

    return (
        <html lang={locale} className={`${inter.variable} ${cormorant.variable}`}>
            <body className="antialiased">
                <NextIntlClientProvider messages={messages}>
                    {children}
                </NextIntlClientProvider>
                <SpeedInsights />
                <Analytics />
            </body>
        </html>
    );
}
