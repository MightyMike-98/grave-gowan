/**
 * @file components/ui/StoriesSection.tsx
 * @description Zeigt alle Erinnerungsgeschichten eines Memorials.
 *
 * - Author initials avatar circle
 * - Relative date display
 * - Favorite toggle + long-press to delete (canEdit)
 * - "Eigene Erinnerung teilen" CTA always after 2nd story
 */

'use client';

import { submitVisitorStory } from '@/app/actions/submitVisitorStory';
import type { Story } from '@/types';
import { createSupabaseBrowserClient } from '@data/browser-client';
import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useRef, useState } from 'react';

const LONG_PRESS_MS = 700;

interface StoriesSectionProps {
    stories: Story[];
    canEdit?: boolean;
    canWrite?: boolean;
    memorialId?: string;
    memorialSlug?: string;
    isAuthenticated?: boolean;
    userName?: string | null;
    onToggleFavorite?: (storyId: string) => void;
    onDeleteStory?: (storyId: string) => void;
    onStoryAdded?: (story: Story) => void;
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

export function StoriesSection({ stories, canEdit = false, canWrite = true, memorialId, memorialSlug, isAuthenticated = false, userName, onToggleFavorite, onDeleteStory, onStoryAdded }: StoriesSectionProps) {
    const t = useTranslations('stories');
    const tSave = useTranslations('save');
    const [pressingId, setPressingId] = useState<string | null>(null);
    const [confirmId, setConfirmId] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [showAuthHint, setShowAuthHint] = useState(false);
    const [storyText, setStoryText] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const authHintRef = useRef<HTMLDivElement>(null);

    // Close auth hint on outside click
    useEffect(() => {
        if (!showAuthHint) return;
        const handler = (e: MouseEvent) => {
            if (authHintRef.current && !authHintRef.current.contains(e.target as Node)) {
                setShowAuthHint(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [showAuthHint]);

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

    const handleSubmitStory = async () => {
        const author = userName?.trim();
        const text = storyText.trim();
        if (!author || !text || !memorialId) return;

        setSubmitting(true);
        try {
            if (canEdit) {
                const supabase = createSupabaseBrowserClient();
                const { data, error } = await supabase
                    .from('memorial_stories')
                    .insert({ memorial_id: memorialId, author, text, status: 'approved' })
                    .select()
                    .single();

                if (error) {
                    console.error('[StoriesSection] Insert error:', error.message);
                    return;
                }

                if (data) {
                    onStoryAdded?.({
                        id: data.id,
                        author,
                        text,
                        date: new Date().toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }),
                        isFavorite: false,
                    });
                }
            } else {
                const result = await submitVisitorStory(memorialId, author, text);
                if (result.error) {
                    console.error('[StoriesSection] Visitor submit error:', result.error);
                    return;
                }
                setSubmitted(true);
            }

            setStoryText('');
            setShowForm(false);
        } catch (err) {
            console.error('[StoriesSection] Submit story error:', err);
        } finally {
            setSubmitting(false);
        }
    };

    const renderStoryCard = (story: Story) => (
        <div
            key={story.id}
            className="relative rounded-xl border p-5 shadow-sm space-y-4 bg-white dark:bg-card select-none overflow-hidden"
            style={{ borderColor: 'hsl(var(--border) / 0.4)' }}
            onPointerDown={() => startPress(story.id)}
            onPointerUp={cancelPress}
            onPointerLeave={cancelPress}
            onContextMenu={canEdit ? (e) => e.preventDefault() : undefined}
        >
            {canEdit && pressingId === story.id && (
                <div
                    className="absolute inset-0 z-10 pointer-events-none rounded-xl"
                    style={{
                        backgroundColor: 'hsl(var(--destructive) / 0.15)',
                        animation: `longpress-fill ${LONG_PRESS_MS}ms ease-in forwards`,
                    }}
                />
            )}

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
                            {t('deleteConfirm')}
                        </p>
                        <div className="flex gap-3 mt-1">
                            <button
                                onClick={() => { setConfirmId(null); onDeleteStory?.(story.id); }}
                                className="rounded-full px-5 py-2 text-xs font-light tracking-wider transition-all"
                                style={{ backgroundColor: 'hsl(var(--foreground))', color: 'hsl(var(--background))' }}
                            >
                                {t('deleteYes')}
                            </button>
                            <button
                                onClick={() => setConfirmId(null)}
                                className="rounded-full px-5 py-2 text-xs font-light tracking-wider transition-all"
                                style={{ color: 'hsl(var(--muted-foreground))', border: '1px solid hsl(var(--border) / 0.5)' }}
                            >
                                {t('deleteCancel')}
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
    );

    const storiesAbove = stories.slice(0, 2);
    const storiesBelow = stories.slice(2);

    const loginUrl = `/login?next=${encodeURIComponent(`/memorial/${memorialSlug ?? ''}`)}`;

    const ctaOrForm = !canWrite ? null : !isAuthenticated && !canEdit ? (
        <div className="relative" ref={authHintRef}>
            <button
                onClick={() => setShowAuthHint(true)}
                className="w-full py-3 flex items-center justify-center gap-2 transition-opacity hover:opacity-70"
            >
                <span className="text-base">✏️</span>
                <span className="text-sm font-light" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    {t('shareCta')}
                </span>
            </button>
            <AnimatePresence>
                {showAuthHint && (
                    <motion.div
                        initial={{ opacity: 0, y: -4, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -4, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-64 rounded-xl p-4 shadow-lg z-50"
                        style={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border) / 0.4)' }}
                    >
                        <p className="text-sm font-light text-center" style={{ color: 'hsl(var(--foreground))' }}>
                            <Link href={loginUrl} className="font-medium underline underline-offset-2">{tSave('signIn')}</Link>
                            {' '}{tSave('signInHint')}
                        </p>
                        <button
                            onClick={() => setShowAuthHint(false)}
                            className="absolute top-2 right-2 transition-colors"
                            style={{ color: 'hsl(var(--muted-foreground) / 0.5)' }}
                        >
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    ) : submitted ? (
        <div
            className="py-3 text-center space-y-0.5"
        >
            <p className="text-sm font-light" style={{ color: 'hsl(var(--foreground))' }}>{t('thankYou')}</p>
            <p className="text-xs font-light" style={{ color: 'hsl(var(--muted-foreground))' }}>
                {t('pendingNotice')}
            </p>
        </div>
    ) : !showForm ? (
        <button
            onClick={() => setShowForm(true)}
            className="w-full py-3 flex items-center justify-center gap-2 transition-opacity hover:opacity-70"
        >
            <span className="text-base">✏️</span>
            <span className="text-sm font-light" style={{ color: 'hsl(var(--muted-foreground))' }}>
                {t('shareCta')}
            </span>
        </button>
    ) : (
        <div
            className="rounded-2xl p-4 space-y-3 shadow-sm"
            style={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border) / 0.3)',
            }}
        >
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-sm tracking-tight" style={{ color: 'hsl(var(--foreground))' }}>
                        {t('heading')}
                    </h3>
                    {!canEdit && (
                        <p className="text-[11px] font-light mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
                            {t('subtext')}
                        </p>
                    )}
                </div>
                <button
                    onClick={() => { setShowForm(false); setStoryText(''); }}
                    className="transition-colors hover:opacity-70"
                    style={{ color: 'hsl(var(--muted-foreground))' }}
                >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <div className="space-y-1">
                <label className="text-xs font-medium" style={{ color: 'hsl(var(--foreground))' }}>
                    {t('yourStory')}
                </label>
                <textarea
                    placeholder={t('storyPlaceholder')}
                    value={storyText}
                    onChange={(e) => setStoryText(e.target.value)}
                    rows={3}
                    className="w-full rounded-lg border px-3 py-2 text-xs font-light outline-none transition-colors focus:ring-1 resize-none"
                    style={{
                        borderColor: 'hsl(var(--border) / 0.4)',
                        backgroundColor: 'hsl(var(--muted) / 0.15)',
                        color: 'hsl(var(--foreground))',
                    }}
                />
            </div>

            <div className="flex items-center justify-between gap-3">
                {!canEdit ? (
                    <p className="flex items-center gap-1.5 text-[11px] font-light" style={{ color: 'hsl(var(--muted-foreground))' }}>
                        <svg className="h-3 w-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                        </svg>
                        {t('moderationHint')}
                    </p>
                ) : <span />}
                <button
                    onClick={handleSubmitStory}
                    disabled={submitting || !storyText.trim()}
                    className="shrink-0 rounded-full px-4 py-1.5 text-[11px] font-light tracking-wider transition-all disabled:opacity-40"
                    style={{ backgroundColor: 'hsl(var(--foreground))', color: 'hsl(var(--background))' }}
                >
                    {submitting ? t('saving') : t('publish')}
                </button>
            </div>
        </div>
    );

    return (
        <section aria-label="Memories" className="py-10 space-y-5">
            <style>{`@keyframes longpress-fill { from { opacity: 0; } to { opacity: 1; } }`}</style>

            <div className="space-y-4">
                {storiesAbove.map(renderStoryCard)}
            </div>

            {/* CTA / Form — always visible after 2nd story */}
            {ctaOrForm}

            {storiesBelow.length > 0 && (
                <div className="space-y-4">
                    {storiesBelow.map(renderStoryCard)}
                </div>
            )}
        </section>
    );
}
