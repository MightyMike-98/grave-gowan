/**
 * @file components/ui/StoriesSection.tsx
 * @description Zeigt alle Erinnerungsgeschichten eines Memorials.
 *
 * Iteriert über die Stories-Liste und rendert für jede Story eine `MemoryCard`.
 * Enthält außerdem einen "+ Add Memory"-Button (aktuell ohne Backend-Anbindung)
 * und einen Leer-Zustand, wenn noch keine Erinnerungen vorhanden sind.
 *
 * Reine Server Component – nutzt MemoryCard als Unter-Komponente.
 */

import type { Story } from '@/types';
import { MemoryCard } from './MemoryCard';

/** Props der StoriesSection-Komponente. */
interface StoriesSectionProps {
    /** Liste aller anzuzeigenden Erinnerungsgeschichten. */
    stories: Story[];
    /** Ob der User Inhalte hinzufügen darf (Owner oder Editor). */
    canEdit?: boolean;
}

/**
 * Rendert den vollständigen "Memories"-Bereich mit Header, Button und Kartenliste.
 *
 * @param stories - Array aller anzuzeigenden Story-Objekte.
 */
export function StoriesSection({ stories, canEdit = false }: StoriesSectionProps) {
    return (
        <section aria-label="Memories" className="px-6 py-8 space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-stone-800">Memories</h2>
                {canEdit && (
                    <button className="text-sm font-semibold text-stone-600 bg-stone-100 border border-stone-200 px-4 py-2 rounded-full hover:bg-stone-200 transition-colors">
                        + Add Memory
                    </button>
                )}
            </div>

            {/* Leer-Zustand wenn keine Stories vorhanden */}
            {stories.length === 0 ? (
                <p className="text-stone-500 italic">{canEdit ? 'No memories yet. Add the first one.' : 'No memories yet.'}</p>
            ) : (
                <ul className="space-y-4">
                    {stories.map((story) => (
                        <li key={story.id}>
                            <MemoryCard story={story} />
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}
