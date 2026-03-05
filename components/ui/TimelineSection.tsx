/**
 * @file components/ui/TimelineSection.tsx
 * @description Zeigt die Lebens-Chronik (Timeline) einer verstorbenen Person.
 *
 * Stellt Lebensereignisse chronologisch als vertikale Liste dar.
 * Eine durchgehende vertikale Linie mit runden Markierungspunkten
 * verbindet die einzelnen Ereignisse visuell miteinander.
 *
 * Reine Server Component – keine Interaktivität, kein State.
 */

import type { TimelineEvent } from '@/types';

/** Props der TimelineSection-Komponente. */
interface TimelineSectionProps {
    /** Chronologisch geordnete Liste der Lebensereignisse. */
    events: TimelineEvent[];
}

/**
 * Rendert alle Lebensereignisse als vertikale Timeline mit Verbindungslinie.
 *
 * @param events - Array der darzustellenden Lebensereignisse.
 */
export function TimelineSection({ events }: TimelineSectionProps) {
    return (
        <section aria-label="Life Journey" className="px-6 py-8">
            <h2 className="text-2xl font-bold text-stone-800 mb-8">Life Journey</h2>

            <div className="relative ml-2">
                {/* Durchgehende vertikale Verbindungslinie hinter den Punkten */}
                <div className="absolute left-[7px] top-3 bottom-4 w-0.5 bg-stone-200" />

                <ol className="space-y-8">
                    {events.map((event) => (
                        <li key={event.id} className="flex gap-6 relative">
                            {/* Runder Markierungspunkt auf der Zeitachse */}
                            <div className="relative z-10 mt-0.5 w-4 h-4 rounded-full bg-stone-100 border-4 border-stone-800 flex-shrink-0" />

                            {/* Textinhalt: Jahr, Titel, Beschreibung */}
                            <div className="pb-2">
                                <p className="text-sm font-semibold text-stone-500 uppercase tracking-widest mb-1">
                                    {event.year}
                                </p>
                                <h3 className="text-lg font-medium text-stone-800 mb-2">{event.title}</h3>
                                <p className="text-stone-500 font-light leading-relaxed">{event.description}</p>
                            </div>
                        </li>
                    ))}
                </ol>
            </div>
        </section>
    );
}
