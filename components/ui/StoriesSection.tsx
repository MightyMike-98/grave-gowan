/**
 * @file components/ui/StoriesSection.tsx
 * @description Zeigt alle Erinnerungsgeschichten eines Memorials.
 *
 * Matches gentle-code-mover's StoriesTab:
 * - Author initials avatar circle
 * - Relative date display
 * - Stagger animation for story cards
 * - "Write a story" CTA with dashed border card
 */

import type { Story } from '@/types';

interface StoriesSectionProps {
    stories: Story[];
    canEdit?: boolean;
}

/**
 * Generiert Initialen aus einem Autorennamen (max. 2 Buchstaben).
 */
function getInitials(name: string): string {
    return name
        .split(/[\s()]+/)
        .filter(Boolean)
        .map((w) => w[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
}

export function StoriesSection({ stories, canEdit = false }: StoriesSectionProps) {
    return (
        <section aria-label="Memories" className="py-10 space-y-5">
            <div>
                <h2 className="text-xl tracking-tight" style={{ color: 'hsl(var(--foreground))' }}>
                    Stories <span className="text-base font-light" style={{ color: 'hsl(var(--muted-foreground))' }}>(Gästebuch)</span>
                </h2>
                <p className="text-sm font-light mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    Erlaube Besuchern, persönliche Erinnerungen und Geschichten zu teilen. Markiere Favoriten mit ⭐ für die Highlights.
                </p>
            </div>

            {stories.length === 0 ? (
                <p className="italic font-light" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    {canEdit ? 'No memories yet. Add the first one.' : 'No memories yet.'}
                </p>
            ) : (
                <div className="space-y-4">
                    {stories.map((story) => (
                        <div
                            key={story.id}
                            className="rounded-xl border p-5 shadow-sm space-y-4 bg-white dark:bg-card"
                            style={{ borderColor: 'hsl(var(--border) / 0.4)' }}
                        >
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
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            className="rounded-full p-1 transition-colors hover:bg-foreground/10"
                                            title="Mark as highlight"
                                        >
                                            <svg className="h-3.5 w-3.5 transition-colors" fill={story.isFavorite ? "hsl(45 93% 55%)" : "none"} viewBox="0 0 24 24" stroke={story.isFavorite ? "hsl(45 93% 55%)" : "hsl(var(--muted-foreground) / 0.3)"} strokeWidth={1.5}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                                            </svg>
                                        </button>
                                        <button
                                            type="button"
                                            className="transition-colors hover:opacity-80"
                                            title="Delete Story"
                                            style={{ color: 'hsl(var(--destructive) / 0.7)' }}
                                        >
                                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Story text */}
                            <p className="text-sm font-light leading-relaxed" style={{ color: 'hsl(var(--foreground) / 0.75)' }}>
                                {story.text}
                            </p>
                        </div>
                    ))}
                </div>
            )}

            {canEdit && (
                <div className="flex items-center gap-3 rounded-xl border p-4 shadow-sm bg-card mt-5" style={{ borderColor: 'hsl(var(--border) / 0.4)' }}>
                    <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} style={{ color: 'hsl(var(--muted-foreground))' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <div className="flex-1">
                        <p className="text-sm font-light" style={{ color: 'hsl(var(--foreground))' }}>Moderation</p>
                        <p className="text-[11px] font-light" style={{ color: 'hsl(var(--muted-foreground))' }}>Neue Beiträge vor Veröffentlichung prüfen</p>
                    </div>
                    <label className="relative inline-block h-5 w-9 cursor-pointer rounded-full bg-primary/80">
                        <input type="checkbox" className="sr-only" />
                        <span className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-primary-foreground shadow-sm transition-transform translate-x-4" />
                    </label>
                </div>
            )}

            {canEdit && (
                <div className="pt-8 space-y-4">
                    <h2 className="text-xl tracking-tight" style={{ color: 'hsl(var(--foreground))' }}>Highlights</h2>
                    <div className="rounded-xl border p-5 shadow-sm space-y-3 bg-white dark:bg-card" style={{ borderColor: 'hsl(var(--border) / 0.4)' }}>
                        <div className="flex items-center gap-2.5">
                            <svg className="h-4 w-4 transition-colors" fill="hsl(45 93% 55%)" viewBox="0 0 24 24" stroke="hsl(45 93% 55%)" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                            </svg>
                            <p className="text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>So funktionieren Highlights</p>
                        </div>
                        <p className="text-sm font-light leading-relaxed" style={{ color: 'hsl(var(--foreground) / 0.7)' }}>
                            Der Highlights-Tab zeigt automatisch deine Favoriten: markierte Galerie-Fotos, die Biografie und favorisierte Stories. Nutze den ⭐-Button bei Gallery und Stories oben, um Inhalte als Highlights zu markieren.
                        </p>
                        <div className="flex gap-4 pt-1">
                            <div className="flex items-center gap-1.5">
                                <svg className="h-3 w-3" fill="hsl(45 93% 55%)" viewBox="0 0 24 24" stroke="none">
                                    <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                                </svg>
                                <span className="text-xs font-light" style={{ color: 'hsl(var(--muted-foreground))' }}>
                                    {stories.filter(s => s.isFavorite).length} Favoriten
                                </span>
                            </div>
                        </div>
                    </div>
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
