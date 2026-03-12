/**
 * @file app/layout.tsx
 * @description Das globale Root-Layout der gesamten Cloudyard-Web-App.
 *
 * Diese Datei wird von Next.js automatisch um jede einzelne Seite herum gerendert.
 * Sie definiert die grundlegende HTML-Struktur, den globalen Schriftsatz
 * (Inter + Cormorant Garamond via Google Fonts) und die Standard-Metadaten.
 */

import type { Metadata } from 'next';
import { Inter, Cormorant_Garamond } from 'next/font/google';
import './globals.css';

/**
 * Inter – Body font. Weight 300 (light) als Default, 400/500/600 für Emphasis.
 */
const inter = Inter({
    subsets: ['latin'],
    variable: '--font-inter',
    display: 'swap',
    weight: ['300', '400', '500', '600'],
});

/**
 * Cormorant Garamond – Heading font. Elegant serif für h1–h4.
 * Weight 300/400/500/600 + Italic-Varianten.
 */
const cormorant = Cormorant_Garamond({
    subsets: ['latin'],
    variable: '--font-serif',
    display: 'swap',
    weight: ['300', '400', '500', '600'],
    style: ['normal', 'italic'],
});

/**
 * Standard-Metadaten für SEO und Social-Media-Vorschauen.
 * Können auf einzelnen Seiten (z. B. der Memorial-Seite) überschrieben werden.
 */
export const metadata: Metadata = {
    title: 'Cloudyard',
    description: 'A quiet, respectful space to honor loved ones.',
    openGraph: {
        title: 'Cloudyard',
        description: 'A quiet, respectful space to honor loved ones.',
        type: 'website',
    },
};

/**
 * Root-Layout-Komponente. Wird von Next.js automatisch als äußerste Hülle jeder Seite verwendet.
 */
export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className={`${inter.variable} ${cormorant.variable}`}>
            <body className="antialiased">
                {children}
            </body>
        </html>
    );
}
