/**
 * @file app/page.tsx
 * @description Die Startseite (Landing Page) von Cloudyard.
 *
 * Zeigt einen minimalistischen, zentrierten Willkommens-Bildschirm mit:
 * - Dem App-Namen "Cloudyard"
 * - Einem kurzen Subtext
 * - Drei Aktions-Links: "Visit Memorial", "Create New", "View Example"
 *
 * Reine Server Component – keine Interaktivität, kein State.
 * Die Seite ist der Einstiegspunkt für alle Besucher unter "/".
 */

import type { Metadata } from 'next';
import Link from 'next/link';

/** SEO-Metadaten speziell für die Startseite. */
export const metadata: Metadata = {
  title: 'Cloudyard — Honor Loved Ones',
  description: 'Create and visit digital memorial spaces for the ones you love.',
};

/**
 * Rendert die zentrierte Cloudyard-Startseite mit den drei Haupt-CTAs.
 */
export default function LandingPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 bg-stone-100">
      <div className="text-center max-w-sm">
        <h1 className="text-5xl font-light text-stone-900 tracking-tight mb-3">
          Cloudyard
        </h1>
        <p className="text-stone-500 text-lg mb-12 leading-relaxed">
          A quiet, respectful space to honor loved ones.
        </p>

        <div className="flex flex-col items-center gap-4">
          {/* Primäre Aktion: Gedenkseite besuchen */}
          <Link
            href="/visit"
            className="w-full max-w-xs bg-stone-800 text-stone-100 font-semibold text-sm uppercase tracking-widest py-4 px-8 rounded-full shadow-lg shadow-stone-800/10 hover:bg-stone-900 transition-colors text-center"
          >
            Visit Memorial
          </Link>

          {/* Sekundäre Aktion: Neue Gedenkseite erstellen (require login) */}
          <Link
            href="/login"
            className="text-stone-700 font-medium text-base py-3 hover:text-stone-900 transition-colors"
          >
            Create New
          </Link>

          {/* Demo-Link: Beispiel-Gedenkseite von Sarah Jenkins ansehen */}
          <Link
            href="/memorial/demo"
            className="text-stone-400 text-sm hover:text-stone-600 transition-colors"
          >
            View Example (Sarah Jenkins)
          </Link>
        </div>
      </div>
    </main>
  );
}
