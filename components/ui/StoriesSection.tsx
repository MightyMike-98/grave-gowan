/**
 * @file components/ui/StoriesSection.tsx
 * @description Zeigt alle Erinnerungsgeschichten eines Memorials.
 *
 * Matches gentle-code-mover's StoriesTab:
 * - Subtitle under heading
 * - Stagger animation for story cards
 * - "Write a story" CTA with dashed border card
 */

import type { Story } from '@/types';
import { MemoryCard } from './MemoryCard';

interface StoriesSectionProps {
    stories: Story[];
    canEdit?: boolean;
}

export function StoriesSection({ stories, canEdit = false }: StoriesSectionProps) {
    return (
        <section aria-label="Memories" className="py-10 space-y-6">
            <div>
                <h2 className="text-3xl tracking-tight">Stories</h2>
                <p
                    className="mt-2 text-sm font-light"
                    style={{ color: 'hsl(var(--muted-foreground))' }}
                >
                    Persönliche Erinnerungen und Geschichten von Besuchern.
                </p>
            </div>

            {stories.length === 0 ? (
                <p className="italic font-light" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    {canEdit ? 'No memories yet. Add the first one.' : 'No memories yet.'}
                </p>
            ) : (
                <div className="space-y-6 stagger-children">
                    {stories.map((story) => (
                        <div key={story.id}>
                            <MemoryCard story={story} />
                        </div>
                    ))}
                </div>
            )}

            {/* Write a Story CTA — matches gentle-code-mover */}
            <div
                className="mt-8 flex flex-col items-center gap-3 rounded-xl p-8"
                style={{
                    backgroundColor: 'hsl(var(--muted) / 0.2)',
                    border: '1px dashed hsl(var(--border) / 0.4)',
                }}
            >
                <span className="text-2xl">✍️</span>
                <p className="text-sm font-light" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    Teile deine Erinnerung
                </p>
                <button
                    className="rounded-full px-6 py-2 text-xs font-light uppercase tracking-[0.15em] transition-colors"
                    style={{
                        color: 'hsl(var(--foreground))',
                        border: '1px solid hsl(var(--border) / 0.6)',
                    }}
                >
                    Geschichte schreiben
                </button>
            </div>
        </section>
    );
}
