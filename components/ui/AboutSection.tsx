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
    heading?: string;
}

/**
 * Rendert den Biographie-Bereich der Gedenkseite.
 */
export function AboutSection({ bio, heading }: AboutSectionProps) {
    return (
        <section aria-label="About" className="py-10 space-y-10">
            <div>
                {heading && <h2 className="text-3xl tracking-tight mb-5">{heading}</h2>}
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
