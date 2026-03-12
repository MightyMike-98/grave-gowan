/**
 * @file app/page.tsx
 * @description Die Startseite (Landing Page) von Cloudyard.
 *
 * Zeigt einen minimalistischen, zentrierten Willkommens-Bildschirm mit:
 * - Dem App-Namen "Cloudyard" (Cormorant Garamond)
 * - Einem kurzen Subtext
 * - Drei Aktions-Links: "Visit Memorial", "Create New", "View Example"
 *
 * Reine Server Component – keine Interaktivität, kein State.
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
        <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4">
            {/* Subtle radial glow */}
            <div
                className="pointer-events-none absolute inset-0"
                style={{
                    background: `radial-gradient(ellipse 80% 60% at 50% 40%, hsl(230 40% 92% / 0.6), transparent)`,
                }}
            />

            <div className="relative flex flex-col items-center gap-5 text-center">
                <h1 className="text-5xl tracking-tight md:text-7xl animate-fade-up">
                    Cloudyard
                </h1>

                <p className="max-w-sm text-lg font-light animate-fade-up" style={{ color: 'hsl(var(--muted-foreground))', animationDelay: '0.15s' }}>
                    A quiet, respectful space to honor loved ones.
                </p>

                <div className="mt-6 flex flex-col items-center gap-4 animate-fade-up" style={{ animationDelay: '0.3s' }}>
                    {/* Primäre Aktion: Gedenkseite besuchen */}
                    <Link
                        href="/visit"
                        className="w-72 rounded-full py-4 text-center text-xs font-normal uppercase tracking-[0.25em] shadow-sm transition-shadow duration-300 hover:shadow-md"
                        style={{
                            backgroundColor: 'hsl(var(--primary))',
                            color: 'hsl(var(--primary-foreground))',
                        }}
                    >
                        Visit Memorial
                    </Link>

                    {/* Sekundäre Aktion: Neue Gedenkseite erstellen */}
                    <Link
                        href="/login"
                        className="mt-1 text-sm font-normal transition-colors hover:opacity-100"
                        style={{ color: 'hsl(var(--foreground) / 0.7)' }}
                    >
                        Create New
                    </Link>

                    {/* Demo-Link */}
                    <Link
                        href="/memorial/demo"
                        className="text-sm font-light transition-colors hover:opacity-100"
                        style={{ color: 'hsl(var(--muted-foreground))' }}
                    >
                        View Example (Sarah Jenkins)
                    </Link>
                </div>
            </div>
        </main>
    );
}
