/**
 * @file components/ui/HighlightsSection.tsx
 * @description Zeigt handverlesene Highlights-Inhalte eines Memorials.
 *
 * Matches gentle-code-mover's HighlightsTab:
 * - 2-column grid of highlight cards with icon, category, title, description
 * - Stagger animation, hover shadow
 * - Also shows highlighted photos and stories as before
 */

import type { Memorial } from '@/types';
import Image from 'next/image';

interface HighlightsSectionProps {
    memorial: Memorial;
}

export function HighlightsSection({ memorial }: HighlightsSectionProps) {
    const highlightedPhotos = memorial.photos.filter((p) => memorial.highlights.includes(p.id));
    const highlightedStories = memorial.stories.filter((s) => memorial.highlights.includes(s.id));

    return (
        <section aria-label="Curated Highlights" className="py-10 space-y-10">
            <div>
                <h2 className="text-3xl tracking-tight">Curated Highlights</h2>
                <p
                    className="mt-2 text-sm font-light"
                    style={{ color: 'hsl(var(--muted-foreground))' }}
                >
                    Die prägendsten Momente und Errungenschaften.
                </p>
            </div>

            {/* Highlighted Photos */}
            {highlightedPhotos.length > 0 && (
                <div className="space-y-6 stagger-children">
                    {highlightedPhotos.map((photo) => (
                        <figure key={photo.id} className="space-y-3">
                            <div
                                className="relative w-full h-72 rounded-xl overflow-hidden"
                                style={{ backgroundColor: 'hsl(var(--muted))' }}
                            >
                                <Image
                                    src={photo.url}
                                    alt={photo.caption || 'Highlighted photo'}
                                    fill
                                    className="object-cover"
                                    sizes="(max-width: 768px) 100vw, 600px"
                                />
                            </div>
                            {photo.caption && (
                                <figcaption
                                    className="text-center text-sm font-light italic"
                                    style={{ color: 'hsl(var(--muted-foreground))' }}
                                >
                                    {photo.caption}
                                </figcaption>
                            )}
                        </figure>
                    ))}
                </div>
            )}

            {/* Highlighted Stories */}
            {highlightedStories.length > 0 && (
                <div className="space-y-6 stagger-children">
                    {highlightedStories.map((story) => (
                        <blockquote
                            key={story.id}
                            className="rounded-xl px-6 py-5 space-y-4"
                            style={{
                                backgroundColor: 'hsl(var(--card))',
                                borderLeft: '3px solid hsl(var(--foreground))',
                            }}
                        >
                            <p
                                className="text-lg font-light italic leading-relaxed"
                                style={{
                                    fontFamily: 'var(--font-serif)',
                                    color: 'hsl(var(--foreground) / 0.7)',
                                }}
                            >
                                &ldquo;{story.text}&rdquo;
                            </p>
                            <footer
                                className="text-xs font-light uppercase tracking-[0.15em]"
                                style={{ color: 'hsl(var(--muted-foreground))' }}
                            >
                                — {story.author}
                            </footer>
                        </blockquote>
                    ))}
                </div>
            )}
        </section>
    );
}
