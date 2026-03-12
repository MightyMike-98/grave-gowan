/**
 * @file components/ui/TimelineSection.tsx
 * @description Zeigt die Lebens-Chronik (Timeline) einer verstorbenen Person.
 *
 * Matches gentle-code-mover's TimelineTab:
 * - Vertikale Linie pro Event (nicht durchgehend)
 * - Stagger-animation via stagger-children CSS class
 * - Italic heading
 */

import type { TimelineEvent } from '@/types';

interface TimelineSectionProps {
    events: TimelineEvent[];
}

export function TimelineSection({ events }: TimelineSectionProps) {
    return (
        <section aria-label="Life Journey" className="py-10">
            <h2 className="text-3xl italic tracking-tight mb-10">Life Journey</h2>

            <div className="mt-8 space-y-0 stagger-children">
                {events.map((event, i) => (
                    <div key={event.id} className="relative flex gap-6 pb-10">
                        <div className="flex flex-col items-center">
                            {/* Dot */}
                            <div
                                className="mt-1.5 h-3 w-3 rounded-full"
                                style={{
                                    backgroundColor: 'hsl(var(--background))',
                                    border: '1.5px solid hsl(var(--foreground) / 0.4)',
                                }}
                            />
                            {/* Connecting line (except last item) */}
                            {i < events.length - 1 && (
                                <div
                                    className="w-px flex-1"
                                    style={{ backgroundColor: 'hsl(var(--border) / 0.6)' }}
                                />
                            )}
                        </div>

                        <div className="flex-1">
                            <span
                                className="text-xs font-light tracking-wider"
                                style={{ color: 'hsl(var(--muted-foreground))' }}
                            >
                                {event.year}
                            </span>
                            <h3
                                className="mt-1 text-lg font-medium"
                                style={{ fontFamily: 'var(--font-inter)', color: 'hsl(var(--foreground))' }}
                            >
                                {event.title}
                            </h3>
                            <p
                                className="mt-2 text-[14px] leading-[1.8] font-light"
                                style={{ color: 'hsl(var(--foreground) / 0.65)' }}
                            >
                                {event.description}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
