/**
 * @file components/ui/AboutSection.tsx
 * @description Zeigt den "About"-Bereich einer Gedenkseite.
 *
 * Enthält zwei Teile:
 * 1. Einen langen Biographietext (Bio) der verstorbenen Person.
 * 2. Eine übersichtliche Liste kurzer Fakten (z. B. Herkunft, Ausbildung).
 *
 * Reine Server Component – keine Interaktivität, kein State.
 */

/** Props der AboutSection-Komponente. */
interface AboutSectionProps {
    /** Der vollständige Biographietext der Person. */
    bio: string;
    /** Liste kurzer Fakten über die Person (z. B. ["Born in Portland", "PhD in Science"]). */
    facts: string[];
}

/**
 * Rendert den Biographie- und Fakten-Bereich der Gedenkseite.
 *
 * @param bio - Biographietext der verstorbenen Person.
 * @param facts - Array kurzer Fakten, die als Aufzählungsliste dargestellt werden.
 */
export function AboutSection({ bio, facts }: AboutSectionProps) {
    return (
        <section aria-label="About" className="px-6 py-8 space-y-8">
            {/* Biographie */}
            <div>
                <h2 className="text-2xl font-bold text-stone-800 mb-4">Biography</h2>
                <p className="text-stone-600 text-lg font-light leading-relaxed">{bio}</p>
            </div>

            {/* Fakten-Karte */}
            <div className="bg-stone-50 border border-stone-100 rounded-lg p-6">
                <h3 className="text-xl font-bold text-stone-800 mb-4">Key Facts</h3>
                <ul className="space-y-3">
                    {facts.map((fact, index) => (
                        <li key={index} className="flex items-start gap-3">
                            {/* Kleiner runder Aufzählungspunkt */}
                            <span className="mt-2 w-1.5 h-1.5 rounded-full bg-stone-400 flex-shrink-0" />
                            <span className="text-stone-600">{fact}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    );
}
