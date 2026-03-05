/**
 * @file components/ui/HighlightsSection.tsx
 * @description Zeigt handverlesene Highlights-Inhalte eines Memorials.
 *
 * Filtert aus den gesamten Photos und Stories nur jene heraus, deren ID in
 * `memorial.highlights` enthalten ist. Diese werden besonders hervorgehoben:
 * - Fotos: Groß, vollbreit, mit Bildunterschrift
 * - Stories: Als stilvoll gestaltete Blockquotes mit linkem Randstrich
 *
 * Reine Server Component – keine Interaktivität, kein State.
 */

import type { Memorial } from '@/types';
import Image from 'next/image';

/** Props der HighlightsSection-Komponente. */
interface HighlightsSectionProps {
    /** Das vollständige Memorial-Objekt; Highlights werden daraus gefiltert. */
    memorial: Memorial;
}

/**
 * Rendert die "Curated Highlights"-Sektion mit ausgewählten Fotos und Zitaten.
 * Die Auswahl basiert auf den IDs in `memorial.highlights`.
 *
 * @param memorial - Das Memorial-Objekt, aus dem die Highlights extrahiert werden.
 */
export function HighlightsSection({ memorial }: HighlightsSectionProps) {
    /** Nur Photos, deren ID in der Highlights-Liste vorkommt. */
    const highlightedPhotos = memorial.photos.filter((p) => memorial.highlights.includes(p.id));

    /** Nur Stories, deren ID in der Highlights-Liste vorkommt. */
    const highlightedStories = memorial.stories.filter((s) => memorial.highlights.includes(s.id));

    return (
        <section aria-label="Curated Highlights" className="px-6 py-8 space-y-10">
            <h2 className="text-2xl font-bold text-stone-800">Curated Highlights</h2>

            {/* Hervorgehobene Fotos – vollbreit mit Bildunterschrift */}
            {highlightedPhotos.map((photo) => (
                <figure key={photo.id} className="space-y-3">
                    <div className="relative w-full h-72 rounded-xl overflow-hidden bg-stone-200">
                        <Image
                            src={photo.url}
                            alt={photo.caption || 'Highlighted photo'}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, 600px"
                        />
                    </div>
                    {photo.caption && (
                        <figcaption className="text-center text-stone-500 italic text-sm">
                            {photo.caption}
                        </figcaption>
                    )}
                </figure>
            ))}

            {/* Hervorgehobene Erinnerungen – als stilvoller Blockquote */}
            {highlightedStories.map((story) => (
                <blockquote
                    key={story.id}
                    className="bg-stone-50 border-l-4 border-stone-800 rounded-r-lg px-6 py-5 space-y-4"
                >
                    <p className="text-lg text-stone-700 font-light italic leading-relaxed">
                        &ldquo;{story.text}&rdquo;
                    </p>
                    <footer className="text-sm font-semibold text-stone-500 uppercase tracking-widest">
                        — {story.author}
                    </footer>
                </blockquote>
            ))}
        </section>
    );
}
