/**
 * @file components/ui/MemoryCard.tsx
 * @description Darstellung einer einzelnen Erinnerungsgeschichte.
 *
 * Zeigt Autor, Datum und den Erinnerungstext in einer weißen Karte an.
 * Wird von der `StoriesSection`-Komponente für jede Story in der Liste verwendet.
 *
 * Kleinste, atomare Einheit im Stories-Bereich ("Presentational Component").
 * Reine Server Component – keine Interaktivität, kein State.
 */

import type { Story } from '@/types';

/** Props der MemoryCard-Komponente. */
interface MemoryCardProps {
    /** Die anzuzeigende Story mit Autor, Datum und Text. */
    story: Story;
}

/**
 * Rendert eine einzelne Erinnerungskarte mit Autor, Datum und Text.
 *
 * @param story - Das Story-Objekt, das angezeigt werden soll.
 */
export function MemoryCard({ story }: MemoryCardProps) {
    return (
        <article className="bg-white border border-stone-100 rounded-lg p-6">
            <header className="flex items-center justify-between mb-3">
                <span className="font-semibold text-stone-800">{story.author}</span>
                {/* time-Element für bessere Semantik und Barrierefreiheit */}
                <time className="text-sm text-stone-400">{story.date}</time>
            </header>
            <p className="text-stone-600 leading-relaxed">{story.text}</p>
        </article>
    );
}
