/**
 * @file components/ui/StoriesSection.tsx
 * @description Zeigt alle Erinnerungsgeschichten eines Memorials.
 *
 * - Author initials avatar circle
 * - Relative date display
 * - Favorite toggle + long-press to delete (canEdit)
 * - "Write a story" CTA with dashed border card
 */

'use client';

import type { Story } from '@/types';
import { useCallback, useRef, useState } from 'react';

const LONG_PRESS_MS = 700;

interface StoriesSectionProps {
    stories: Story[];
    canEdit?: boolean;
    onToggleFavorite?: (storyId: string) => void;
    onDeleteStory?: (storyId: string) => void;
}

function getInitials(name: string): string {
    return name
        .split(/[\s()]+/)
        .filter(Boolean)
        .map((w) => w[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
}

export function StoriesSection({ stories, canEdit = false, onToggleFavorite, onDeleteStory }: StoriesSectionProps) {
    const [pressingId, setPressingId] = useState<string | null>(null);
    const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const startPress = useCallback((storyId: string) => {
        if (!canEdit) return;
        setPressingId(storyId);
        pressTimer.current = setTimeout(() => {
            setPressingId(null);
            onDeleteStory?.(storyId);
        }, LONG_PRESS_MS);
    }, [canEdit, onDeleteStory]);

    const cancelPress = useCallback(() => {
        if (pressTimer.current) clearTimeout(pressTimer.current);
        pressTimer.current = null;
        setPressingId(null);
    }, []);

    return (
        <section aria-label="Memories" className="py-10 space-y-5">
            {/* Long-press animation keyframe */}
            <style>{`@keyframes longpress-fill { from { opacity: 0; } to { opacity: 1; } }`}</style>

            <div>
                <h2 className="text-xl tracking-tight" style={{ color: 'hsl(var(--foreground))' }}>
                    Stories <span className="text-base font-light" style={{ color: 'hsl(var(--muted-foreground))' }}>(Gästebuch)</span>
                </h2>
                {canEdit && (
                    <p className="text-sm font-light mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
                        Markiere Favoriten mit ⭐ für die Highlights. Gedrückt halten zum Löschen.
                    </p>
                )}
            </div>

            <div className="space-y-4">
                {stories.map((story) => (
                    <div
                        key={story.id}
                        className="relative rounded-xl border p-5 shadow-sm space-y-4 bg-white dark:bg-card select-none overflow-hidden"
                        style={{ borderColor: 'hsl(var(--border) / 0.4)' }}
                        onPointerDown={() => startPress(story.id)}
                        onPointerUp={cancelPress}
                        onPointerLeave={cancelPress}
                        onContextMenu={canEdit ? (e) => e.preventDefault() : undefined}
                    >
                        {/* Long-press delete overlay */}
                        {canEdit && pressingId === story.id && (
                            <div
                                className="absolute inset-0 z-10 pointer-events-none rounded-xl"
                                style={{
                                    backgroundColor: 'hsl(var(--destructive) / 0.15)',
                                    animation: `longpress-fill ${LONG_PRESS_MS}ms ease-in forwards`,
                                }}
                            />
                        )}

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <div
                                    className="flex h-8 w-8 items-center justify-center rounded-full text-xs"
                                    style={{
                                        backgroundColor: 'hsl(var(--muted) / 0.6)',
                                        color: 'hsl(var(--muted-foreground))',
                                    }}
                                >
                                    {getInitials(story.author)}
                                </div>
                                <div>
                                    <p className="text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>
                                        {story.author}
                                    </p>
                                    <p className="text-[11px] font-light" style={{ color: 'hsl(var(--muted-foreground))' }}>
                                        {story.date}
                                    </p>
                                </div>
                            </div>
                            {canEdit && (
                                <button
                                    type="button"
                                    onClick={() => onToggleFavorite?.(story.id)}
                                    onPointerDown={(e) => e.stopPropagation()}
                                    className="relative z-20 rounded-full p-1 transition-colors hover:bg-foreground/10"
                                    title="Mark as highlight"
                                >
                                    <svg className="h-3.5 w-3.5 transition-colors" fill={story.isFavorite ? "hsl(45 93% 55%)" : "none"} viewBox="0 0 24 24" stroke={story.isFavorite ? "hsl(45 93% 55%)" : "hsl(var(--muted-foreground) / 0.3)"} strokeWidth={1.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                                    </svg>
                                </button>
                            )}
                        </div>

                        <p className="text-sm font-light leading-relaxed" style={{ color: 'hsl(var(--foreground) / 0.75)' }}>
                            {story.text}
                        </p>
                    </div>
                ))}
            </div>

            {/* Write a Story CTA */}
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
