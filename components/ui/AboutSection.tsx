/**
 * @file components/ui/AboutSection.tsx
 * @description Zeigt den "About"-Bereich einer Gedenkseite.
 *
 * Enthält den Biographietext der verstorbenen Person.
 * Key Facts section removed per user request.
 *
 * Reine Server Component – keine Interaktivität, kein State.
 */

/** Props der AboutSection-Komponente. */
interface AboutSectionProps {
    bio: string;
}

/**
 * Rendert den Biographie-Bereich der Gedenkseite.
 */
export function AboutSection({ bio }: AboutSectionProps) {
    return (
        <section aria-label="About" className="py-10 space-y-10">
            <div>
                <p
                    className="text-[15px] leading-[1.8] font-light"
                    style={{ color: 'hsl(var(--foreground) / 0.75)' }}
                >
                    {bio}
                </p>
            </div>
        </section>
    );
}
