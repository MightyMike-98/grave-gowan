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
    const [confirmId, setConfirmId] = useState<string | null>(null);
    const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const startPress = useCallback((storyId: string) => {
        if (!canEdit || confirmId) return;
        setPressingId(storyId);
        pressTimer.current = setTimeout(() => {
            setPressingId(null);
            setConfirmId(storyId);
        }, LONG_PRESS_MS);
    }, [canEdit, confirmId]);

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
                        {/* Long-press progress overlay */}
                        {canEdit && pressingId === story.id && (
                            <div
                                className="absolute inset-0 z-10 pointer-events-none rounded-xl"
                                style={{
                                    backgroundColor: 'hsl(var(--destructive) / 0.15)',
                                    animation: `longpress-fill ${LONG_PRESS_MS}ms ease-in forwards`,
                                }}
                            />
                        )}

                        {/* Delete confirmation overlay */}
                        {canEdit && confirmId === story.id && (
                            <div
                                className="absolute inset-0 z-30 flex items-center justify-center gap-6 rounded-xl backdrop-blur-md"
                                style={{ backgroundColor: 'hsl(var(--background) / 0.9)' }}
                                onPointerDown={(e) => e.stopPropagation()}
                            >
                                <div className="flex flex-col items-center gap-3">
                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2} style={{ color: 'hsl(var(--muted-foreground))' }}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                    </svg>
                                    <p className="text-sm font-light tracking-wide" style={{ color: 'hsl(var(--muted-foreground))' }}>
                                        Story entfernen?
                                    </p>
                                    <div className="flex gap-3 mt-1">
                                        <button
                                            onClick={() => { setConfirmId(null); onDeleteStory?.(story.id); }}
                                            className="rounded-full px-5 py-2 text-xs font-light tracking-wider transition-all"
                                            style={{ backgroundColor: 'hsl(var(--foreground))', color: 'hsl(var(--background))' }}
                                        >
                                            Entfernen
                                        </button>
                                        <button
                                            onClick={() => setConfirmId(null)}
                                            className="rounded-full px-5 py-2 text-xs font-light tracking-wider transition-all"
                                            style={{ color: 'hsl(var(--muted-foreground))', border: '1px solid hsl(var(--border) / 0.5)' }}
                                        >
                                            Abbrechen
                                        </button>
                                    </div>
                                </div>
                            </div>
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
                            {canEdit && !confirmId && (
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
