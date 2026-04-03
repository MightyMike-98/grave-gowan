'use client';

import { useTranslations } from 'next-intl';
import { useCallback, useRef, useState } from 'react';

const LONG_PRESS_MS = 700;

interface StoryDraft {
    id: string;
    author: string;
    text: string;
    date: string;
    favorite: boolean;
}

interface PendingStory {
    id: string;
    author: string;
    text: string;
    date: string;
}

interface StoriesEditorProps {
    stories: StoryDraft[];
    pendingStories: PendingStory[];
    onAddStory: (author: string, text: string) => void;
    onApprove: (storyId: string) => void;
    onReject: (storyId: string) => void;
    onToggleFavorite: (storyId: string) => void;
    onDelete: (storyId: string) => void;
}

export function StoriesEditor({ stories, pendingStories, onAddStory, onApprove, onReject, onToggleFavorite, onDelete }: StoriesEditorProps) {
    const t = useTranslations('create');
    const [storyAuthor, setStoryAuthor] = useState('');
    const [storyText, setStoryText] = useState('');
    const [pressingId, setPressingId] = useState<string | null>(null);
    const [confirmId, setConfirmId] = useState<string | null>(null);
    const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const startPress = useCallback((storyId: string) => {
        if (confirmId) return;
        setPressingId(storyId);
        pressTimer.current = setTimeout(() => {
            setPressingId(null);
            setConfirmId(storyId);
        }, LONG_PRESS_MS);
    }, [confirmId]);

    const cancelPress = useCallback(() => {
        if (pressTimer.current) clearTimeout(pressTimer.current);
        pressTimer.current = null;
        setPressingId(null);
    }, []);

    const handleAdd = () => {
        const author = storyAuthor.trim();
        const text = storyText.trim();
        if (!author || !text) return;
        onAddStory(author, text);
        setStoryAuthor('');
        setStoryText('');
    };

    return (
        <section id="stories" className="pt-12 space-y-5">
            <div className="mb-8 h-px" style={{ backgroundColor: 'hsl(var(--border) / 0.4)' }} />
            <style>{`@keyframes longpress-fill { from { opacity: 0; } to { opacity: 1; } }`}</style>
            <h2 className="text-xl tracking-tight">
                {t('storiesGuestbook')}
            </h2>
            <p className="text-sm font-light" style={{ color: 'hsl(var(--muted-foreground))' }}>
                {t('storiesDescription')}
            </p>

            {/* Pending stories queue */}
            {pendingStories.length > 0 && (
                <div className="space-y-4">
                    <div className="flex items-center gap-2.5">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} style={{ color: 'hsl(var(--muted-foreground))' }}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <h3 className="text-base tracking-tight" style={{ color: 'hsl(var(--foreground))' }}>{t('queue')}</h3>
                        <span className="rounded-full px-2.5 py-0.5 text-[10px] font-medium" style={{ backgroundColor: 'hsl(var(--foreground) / 0.08)', color: 'hsl(var(--foreground))' }}>
                            {t('pendingCount', { count: pendingStories.length })}
                        </span>
                    </div>

                    {pendingStories.map(story => (
                        <div key={story.id} className="rounded-xl border p-5 space-y-4" style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border) / 0.4)' }}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full text-xs" style={{ backgroundColor: 'hsl(var(--muted) / 0.6)', color: 'hsl(var(--muted-foreground))' }}>
                                        {story.author.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>{story.author}</p>
                                        <p className="text-[11px] font-light" style={{ color: 'hsl(var(--muted-foreground))' }}>{story.date}</p>
                                    </div>
                                </div>
                                <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-normal" style={{ border: '1px solid hsl(var(--border) / 0.5)', color: 'hsl(var(--muted-foreground))' }}>
                                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    {t('pendingBadge')}
                                </span>
                            </div>
                            <p className="text-sm font-light leading-relaxed" style={{ color: 'hsl(var(--foreground) / 0.75)' }}>{story.text}</p>
                            <div className="flex gap-3">
                                <button type="button" onClick={() => onApprove(story.id)} className="flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-light tracking-wider transition-all" style={{ backgroundColor: 'hsl(var(--foreground))', color: 'hsl(var(--background))' }}>
                                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                                    {t('approve')}
                                </button>
                                <button type="button" onClick={() => onReject(story.id)} className="flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-light tracking-wider transition-all" style={{ color: 'hsl(var(--destructive))', border: '1px solid hsl(var(--destructive) / 0.3)', backgroundColor: 'hsl(var(--destructive) / 0.05)' }}>
                                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                    {t('reject')}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add story form */}
            <div className="rounded-xl p-5 space-y-3" style={{ backgroundColor: 'hsl(var(--muted) / 0.15)', border: '1px dashed hsl(var(--border) / 0.5)' }}>
                <input type="text" value={storyAuthor} onChange={(e) => setStoryAuthor(e.target.value)} placeholder={t('placeholderAuthor')} className="field-input" />
                <textarea value={storyText} onChange={(e) => setStoryText(e.target.value)} placeholder={t('placeholderStory')} rows={3} className="field-input resize-none" />
                <button
                    type="button"
                    onClick={handleAdd}
                    disabled={!storyAuthor.trim() || !storyText.trim()}
                    className="rounded-full px-5 py-2 text-xs font-light uppercase tracking-[0.15em] transition-colors disabled:opacity-40"
                    style={{ backgroundColor: 'hsl(var(--foreground) / 0.08)', color: 'hsl(var(--foreground) / 0.7)', border: '1px solid hsl(var(--border) / 0.4)' }}
                >
                    {t('addStory')}
                </button>
            </div>

            {/* Story list */}
            <div className="space-y-4">
                {stories.map(story => (
                    <div
                        key={story.id}
                        className="relative rounded-xl border p-5 shadow-sm space-y-4 select-none overflow-hidden"
                        style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border) / 0.4)' }}
                        onPointerDown={() => startPress(story.id)}
                        onPointerUp={cancelPress}
                        onPointerLeave={cancelPress}
                        onContextMenu={(e) => e.preventDefault()}
                    >
                        {/* Long-press progress */}
                        {pressingId === story.id && (
                            <div className="absolute inset-0 z-10 pointer-events-none rounded-xl" style={{ backgroundColor: 'hsl(var(--destructive) / 0.15)', animation: `longpress-fill ${LONG_PRESS_MS}ms ease-in forwards` }} />
                        )}

                        {/* Delete confirmation */}
                        {confirmId === story.id && (
                            <div className="absolute inset-0 z-30 flex items-center justify-center gap-6 rounded-xl backdrop-blur-md" style={{ backgroundColor: 'hsl(var(--background) / 0.9)' }} onPointerDown={(e) => e.stopPropagation()}>
                                <div className="flex flex-col items-center gap-3">
                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2} style={{ color: 'hsl(var(--muted-foreground))' }}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                    </svg>
                                    <p className="text-sm font-light tracking-wide" style={{ color: 'hsl(var(--muted-foreground))' }}>{t('storyRemoveConfirm')}</p>
                                    <div className="flex gap-3 mt-1">
                                        <button type="button" onClick={() => { setConfirmId(null); onDelete(story.id); }} className="rounded-full px-5 py-2 text-xs font-light tracking-wider transition-all" style={{ backgroundColor: 'hsl(var(--foreground))', color: 'hsl(var(--background))' }}>{t('storyRemove')}</button>
                                        <button type="button" onClick={() => setConfirmId(null)} className="rounded-full px-5 py-2 text-xs font-light tracking-wider transition-all" style={{ color: 'hsl(var(--muted-foreground))', border: '1px solid hsl(var(--border) / 0.5)' }}>{t('storyCancel')}</button>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full text-xs" style={{ backgroundColor: 'hsl(var(--muted) / 0.6)', color: 'hsl(var(--muted-foreground))' }}>
                                    {story.author.substring(0, 2).toUpperCase()}
                                </div>
                                <div>
                                    <p className="text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>{story.author}</p>
                                    <p className="text-[11px] font-light" style={{ color: 'hsl(var(--muted-foreground))' }}>{story.date}</p>
                                </div>
                            </div>
                            {!confirmId && (
                                <button type="button" onClick={() => onToggleFavorite(story.id)} onPointerDown={(e) => e.stopPropagation()} className="relative z-20 rounded-full p-1 transition-colors hover:bg-foreground/10">
                                    <svg className="h-3.5 w-3.5 transition-colors" fill={story.favorite ? "hsl(45 93% 55%)" : "none"} viewBox="0 0 24 24" stroke={story.favorite ? "hsl(45 93% 55%)" : "hsl(var(--muted-foreground) / 0.3)"} strokeWidth={1.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                                    </svg>
                                </button>
                            )}
                        </div>
                        <p className="text-sm font-light leading-relaxed" style={{ color: 'hsl(var(--foreground) / 0.75)' }}>{story.text}</p>
                    </div>
                ))}
            </div>
        </section>
    );
}
