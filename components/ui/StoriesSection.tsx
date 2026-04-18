/**
 * @file components/ui/StoriesSection.tsx
 * @description Zeigt alle Erinnerungsgeschichten eines Memorials.
 *
 * - Minimalistisches Kartendesign (Name + Beziehungs-Badge + Datum, Text darunter)
 * - Pflichtfeld Beziehung beim Einreichen
 * - Favorite toggle (canEdit)
 */

'use client';

import { submitVisitorStory } from '@/app/actions/submitVisitorStory';
import type { Story } from '@/types';
import { createSupabaseBrowserClient } from '@data/browser-client';
import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';

interface StoriesSectionProps {
    stories: Story[];
    canEdit?: boolean;
    canWrite?: boolean;
    memorialId?: string;
    memorialSlug?: string;
    isAuthenticated?: boolean;
    userName?: string | null;
    onToggleFavorite?: (storyId: string) => void;
    onStoryAdded?: (story: Story) => void;
    heading?: string;
}

const RELATION_KEYS = ['family', 'friend', 'colleague', 'fan', 'acquaintance', 'other'] as const;
type RelationKey = typeof RELATION_KEYS[number];

export function StoriesSection({ stories, canEdit = false, canWrite = true, memorialId, memorialSlug, isAuthenticated = false, userName, onToggleFavorite, onStoryAdded, heading }: StoriesSectionProps) {
    const t = useTranslations('stories');
    const [showForm, setShowForm] = useState(false);
    const [showAuthHint, setShowAuthHint] = useState(false);
    const [storyText, setStoryText] = useState('');
    const [storyRelation, setStoryRelation] = useState<RelationKey | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
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

    const relationLabel = (key: string | undefined): string | null => {
        if (!key) return null;
        if ((RELATION_KEYS as readonly string[]).includes(key)) {
            return t(`relation_${key}` as `relation_${RelationKey}`);
        }
        return key;
    };

    const handleSubmitStory = async () => {
        const author = userName?.trim();
        const text = storyText.trim();
        if (!author || !text || !memorialId || !storyRelation) return;

        setSubmitting(true);
        try {
            if (canEdit) {
                const supabase = createSupabaseBrowserClient();
                const { data, error } = await supabase
                    .from('memorial_stories')
                    .insert({ memorial_id: memorialId, author, text, relation: storyRelation, status: 'approved' })
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
                        relation: storyRelation,
                    });
                }
            } else {
                const result = await submitVisitorStory(memorialId, author, text, storyRelation);
                if (result.error) {
                    console.error('[StoriesSection] Visitor submit error:', result.error);
                    return;
                }
                setSubmitted(true);
            }

            setStoryText('');
            setStoryRelation(null);
            setShowForm(false);
        } catch (err) {
            console.error('[StoriesSection] Submit story error:', err);
        } finally {
            setSubmitting(false);
        }
    };

    const renderStoryCard = (story: Story) => {
        const relLabel = relationLabel(story.relation);
        return (
            <div
                key={story.id}
                className="rounded-xl border p-5 shadow-sm bg-white dark:bg-card"
                style={{ borderColor: 'hsl(var(--border) / 0.4)' }}
            >
                <div className="flex items-baseline justify-between gap-3">
                    <div className="flex flex-wrap items-baseline gap-2">
                        <p className="text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>
                            {story.author}
                        </p>
                        {relLabel && (
                            <span
                                className="rounded-full border px-2 py-0.5 text-[10px] font-light"
                                style={{
                                    borderColor: 'hsl(var(--border) / 0.4)',
                                    backgroundColor: 'hsl(var(--muted) / 0.4)',
                                    color: 'hsl(var(--muted-foreground))',
                                }}
                            >
                                {relLabel}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <p className="text-[11px] font-light" style={{ color: 'hsl(var(--muted-foreground) / 0.7)' }}>
                            {story.date}
                        </p>
                        {canEdit && (
                            <button
                                type="button"
                                onClick={() => onToggleFavorite?.(story.id)}
                                className="rounded-full p-1 transition-colors hover:bg-foreground/10"
                                title="Mark as highlight"
                            >
                                <svg className="h-3.5 w-3.5 transition-colors" fill={story.isFavorite ? "hsl(45 93% 55%)" : "none"} viewBox="0 0 24 24" stroke={story.isFavorite ? "hsl(45 93% 55%)" : "hsl(var(--muted-foreground) / 0.3)"} strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                                </svg>
                            </button>
                        )}
                    </div>
                </div>

                <p className="mt-4 text-[14px] leading-[1.8] font-light" style={{ color: 'hsl(var(--foreground) / 0.7)' }}>
                    {story.text}
                </p>
            </div>
        );
    };

    const storiesAbove = stories.slice(0, 2);
    const storiesBelow = stories.slice(2);

    const loginUrl = `/login?next=${encodeURIComponent(`/memorial/${memorialSlug ?? ''}`)}`;

    const ctaOrForm = !showForm ? null : (
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
                    onClick={() => { setShowForm(false); setStoryText(''); setStoryRelation(null); }}
                    className="transition-colors hover:opacity-70"
                    style={{ color: 'hsl(var(--muted-foreground))' }}
                >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <div className="space-y-1.5">
                <label className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    {t('relationLabel')}
                </label>
                <div className="flex flex-wrap gap-2">
                    {RELATION_KEYS.map((key) => {
                        const active = storyRelation === key;
                        return (
                            <button
                                key={key}
                                type="button"
                                onClick={() => setStoryRelation(key)}
                                className="rounded-full border px-3 py-1.5 text-xs font-light transition-colors"
                                style={active ? {
                                    borderColor: 'hsl(var(--foreground))',
                                    backgroundColor: 'hsl(var(--foreground))',
                                    color: 'hsl(var(--background))',
                                } : {
                                    borderColor: 'hsl(var(--border) / 0.6)',
                                    backgroundColor: 'transparent',
                                    color: 'hsl(var(--muted-foreground))',
                                }}
                            >
                                {t(`relation_${key}`)}
                            </button>
                        );
                    })}
                </div>
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
                    disabled={submitting || !storyText.trim() || !storyRelation}
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

            {heading && (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
                    <h2 className="text-3xl tracking-tight">
                        {heading}
                    </h2>
                    {canWrite && !showForm && !submitted && (
                        <div className="relative" ref={authHintRef}>
                            <button
                                onClick={() => {
                                    if (!isAuthenticated && !canEdit) {
                                        setShowAuthHint(true);
                                    } else {
                                        setShowForm(true);
                                    }
                                }}
                                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-light shadow-sm transition-colors whitespace-nowrap"
                                style={{ border: '1px solid hsl(var(--border) / 0.6)', color: 'hsl(var(--foreground))' }}
                            >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                                {t('shareCta')}
                            </button>
                            <AnimatePresence>
                                {showAuthHint && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -4, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: -4, scale: 0.95 }}
                                        transition={{ duration: 0.2, ease: 'easeOut' }}
                                        className="absolute right-0 top-full mt-2 w-64 rounded-xl p-4 shadow-lg z-50"
                                        style={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border) / 0.4)' }}
                                    >
                                        <p className="text-sm font-light text-center" style={{ color: 'hsl(var(--foreground))' }}>
                                            <Link href={loginUrl} className="font-medium underline underline-offset-2">{t('signIn')}</Link>
                                            {' '}{t('signInHint')}
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
                    )}
                    {submitted && (
                        <span className="text-sm font-light" style={{ color: 'hsl(var(--muted-foreground))' }}>{t('thankYou')}</span>
                    )}
                </div>
            )}

            {/* Form inline when open */}
            {showForm && ctaOrForm}

            <div className="space-y-4">
                {storiesAbove.map(renderStoryCard)}
            </div>

            {storiesBelow.length > 0 && (
                <div className="space-y-4">
                    {storiesBelow.map(renderStoryCard)}
                </div>
            )}
        </section>
    );
}
