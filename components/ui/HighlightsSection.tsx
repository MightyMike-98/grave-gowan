/**
 * @file components/ui/HighlightsSection.tsx
 * @description Zeigt den Highlights-Feed (Favorisierte Bilder, Biografie-Vorschau, Lieblings-Stories).
 * Matches gentle-code-mover's Highlights implementation exactly.
 */

'use client';

import type { MemorialView } from '@/types';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

const fadeIn = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } },
};

function isVideoUrl(url: string): boolean {
    return /\.(mp4|mov|webm)(\?|$)/i.test(url);
}

interface HighlightsSectionProps {
    memorial: MemorialView;
    canEdit?: boolean;
    onTabChange?: (tab: string) => void;
}

export function HighlightsSection({ memorial, canEdit = false, onTabChange }: HighlightsSectionProps) {
    const t = useTranslations('highlights');
    const favoriteGallery = memorial.photos.filter((p) => p.isFavorite);
    const favoriteStories = memorial.stories.filter((s) => s.isFavorite);
    const [lightbox, setLightbox] = useState<number | null>(null);

    return (
        <section aria-label="Memorial Highlights" className="py-10 space-y-16">
            


            {/* 1. Favorite Photos (Masonry/Grid) */}
            {favoriteGallery.length > 0 && (
                <motion.div variants={fadeIn} initial="hidden" animate="visible">
                    <p
                        className="text-[10px] font-medium uppercase tracking-[0.2em]"
                        style={{ color: 'hsl(var(--muted-foreground) / 0.5)' }}
                    >
                        {t('memories')}
                    </p>
                    <h2 className="mt-1 text-3xl tracking-tight" style={{ color: 'hsl(var(--foreground))' }}>
                        {t('photos')}
                    </h2>
                    <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3">
                        {favoriteGallery.map((img, i) => (
                            <motion.div
                                key={img.id}
                                className="group relative aspect-square cursor-pointer overflow-hidden rounded-xl bg-muted"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setLightbox(i)}
                            >
                                {isVideoUrl(img.url) ? (
                                    <video
                                        src={img.url}
                                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                        muted
                                        loop
                                        playsInline
                                        preload="metadata"
                                        onMouseEnter={(e) => e.currentTarget.play().catch(() => {})}
                                        onMouseLeave={(e) => { e.currentTarget.pause(); e.currentTarget.currentTime = 0; }}
                                    />
                                ) : (
                                    <img
                                        src={img.url}
                                        alt={img.caption ?? ''}
                                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                        loading="lazy"
                                    />
                                )}
                                {isVideoUrl(img.url) && (
                                    <div className="pointer-events-none absolute top-2 left-2 transition-opacity duration-300 group-hover:opacity-0">
                                        <svg
                                            className="h-3.5 w-3.5 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]"
                                            fill="white"
                                            viewBox="0 0 24 24"
                                        >
                                            <path d="M8 5v14l11-7z" />
                                        </svg>
                                    </div>
                                )}
                                {img.caption && (
                                    <>
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                                        <p className="absolute bottom-0 left-0 right-0 p-3 text-xs font-light text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                                            {img.caption}
                                        </p>
                                    </>
                                )}
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* 2. Biography Preview */}
            {memorial.bio && (
                <motion.div variants={fadeIn} initial="hidden" animate="visible">
                    <p
                        className="text-[10px] font-medium uppercase tracking-[0.2em]"
                        style={{ color: 'hsl(var(--muted-foreground) / 0.5)' }}
                    >
                        {t('biography')}
                    </p>
                    <h2 className="mt-1 text-3xl tracking-tight" style={{ color: 'hsl(var(--foreground))' }}>
                        {t('aboutHeading', { name: memorial.name.split(' ')[0] })}
                    </h2>
                    <p
                        className="mt-4 text-[15px] leading-[1.8] font-light"
                        style={{ color: 'hsl(var(--foreground) / 0.75)' }}
                    >
                        {memorial.bio}
                    </p>
                </motion.div>
            )}

            {/* 3. Favorite Stories */}
            {favoriteStories.length > 0 && (
                <div>
                    <motion.p
                        variants={fadeIn}
                        initial="hidden" animate="visible"
                        className="text-[10px] font-medium uppercase tracking-[0.2em]"
                        style={{ color: 'hsl(var(--muted-foreground) / 0.5)' }}
                    >
                        {t('favoriteStories')}
                    </motion.p>
                    <motion.h2
                        variants={fadeIn}
                        initial="hidden" animate="visible"
                        className="mt-1 text-3xl tracking-tight"
                        style={{ color: 'hsl(var(--foreground))' }}
                    >
                        {t('stories')}
                    </motion.h2>
                    <div className="mt-6 space-y-5">
                        {favoriteStories.map((story) => (
                            <motion.div
                                key={story.id}
                                variants={fadeIn}
                                initial="hidden" animate="visible"
                                className="rounded-xl border p-5 shadow-sm"
                                style={{
                                    backgroundColor: 'hsl(var(--card))',
                                    borderColor: 'hsl(var(--border) / 0.4)',
                                }}
                            >
                                <div className="flex items-center gap-3">
                                    <div
                                        className="flex h-9 w-9 items-center justify-center rounded-full text-[10px] font-medium"
                                        style={{
                                            backgroundColor: 'hsl(var(--muted))',
                                            color: 'hsl(var(--muted-foreground))',
                                        }}
                                    >
                                        {story.author.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>
                                            {story.author}
                                        </p>
                                        <p className="text-[11px] font-light" style={{ color: 'hsl(var(--muted-foreground) / 0.6)' }}>
                                            {story.date}
                                        </p>
                                    </div>
                                </div>
                                <p
                                    className="mt-4 text-[14px] leading-[1.8] font-light"
                                    style={{ color: 'hsl(var(--foreground) / 0.7)' }}
                                >
                                    {story.text}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}

            {/* Lightbox for Gallery */}
            <AnimatePresence>
                {lightbox !== null && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
                        style={{ backgroundColor: 'hsl(var(--foreground) / 0.9)' }}
                        onClick={() => setLightbox(null)}
                    >
                        <button
                            className="absolute right-4 top-4 rounded-full p-2 transition-colors hover:text-white"
                            style={{ color: 'hsl(var(--primary-foreground) / 0.7)' }}
                            onClick={() => setLightbox(null)}
                        >
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                        {isVideoUrl(favoriteGallery[lightbox].url) ? (
                            <motion.video
                                key={lightbox}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.3 }}
                                src={favoriteGallery[lightbox].url}
                                className="max-h-[85vh] max-w-[90vw] rounded-lg object-contain shadow-2xl"
                                controls
                                autoPlay
                                playsInline
                                onClick={(e) => e.stopPropagation()}
                            />
                        ) : (
                            <motion.img
                                key={lightbox}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.3 }}
                                src={favoriteGallery[lightbox].url}
                                alt={favoriteGallery[lightbox].caption ?? ''}
                                className="max-h-[85vh] max-w-[90vw] rounded-lg object-contain shadow-2xl"
                                onClick={(e) => e.stopPropagation()}
                            />
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    );
}
