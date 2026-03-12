/**
 * @file components/ui/MemoryCard.tsx
 * @description Darstellung einer einzelnen Erinnerungsgeschichte.
 *
 * Zeigt Autor (mit Initialen-Avatar), Datum und den Erinnerungstext
 * in einer Karte mit dem neuen Design-System.
 *
 * Reine Server Component – keine Interaktivität, kein State.
 */

import type { Story } from '@/types';

/** Props der MemoryCard-Komponente. */
interface MemoryCardProps {
    story: Story;
}

/**
 * Rendert eine einzelne Erinnerungskarte.
 */
export function MemoryCard({ story }: MemoryCardProps) {
    const initials = story.author
        .split(' ')
        .map((w) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

    return (
        <article
            className="rounded-xl p-5 shadow-sm"
            style={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border) / 0.4)',
            }}
        >
            <header className="flex items-center gap-2.5 mb-3">
                {/* Initialen-Avatar */}
                <div
                    className="h-8 w-8 rounded-full flex items-center justify-center text-xs"
                    style={{
                        backgroundColor: 'hsl(var(--muted) / 0.6)',
                        color: 'hsl(var(--muted-foreground))',
                    }}
                >
                    {initials}
                </div>
                <div>
                    <span className="text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>
                        {story.author}
                    </span>
                    <time
                        className="block text-[11px] font-light"
                        style={{ color: 'hsl(var(--muted-foreground))' }}
                    >
                        {story.date}
                    </time>
                </div>
            </header>
            <p
                className="text-sm font-light leading-relaxed"
                style={{ color: 'hsl(var(--foreground) / 0.75)' }}
            >
                {story.text}
            </p>
        </article>
    );
}
