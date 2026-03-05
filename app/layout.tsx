/**
 * @file app/layout.tsx
 * @description Das globale Root-Layout der gesamten Cloudyard-Web-App.
 *
 * Diese Datei wird von Next.js automatisch um jede einzelne Seite herum gerendert.
 * Sie definiert die grundlegende HTML-Struktur, den globalen Schriftsatz (Inter via Google Fonts),
 * die Hintergrundfarbe und die Standard-Metadaten (Titel, Beschreibung) für SEO.
 *
 * Alles was hier steht, ist auf ALLEN Seiten der App sichtbar.
 */

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

/**
 * Konfiguration der Inter-Schriftart.
 * Wird als CSS-Variable (`--font-inter`) eingebunden, damit sie in der ganzen App
 * über Tailwind (`font-sans`) genutzt werden kann.
 */
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
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
 *
 * @param children - Die eigentliche Seite, die innerhalb dieses Layouts gerendert wird.
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-stone-100 text-stone-800 antialiased">
        {children}
      </body>
    </html>
  );
}
