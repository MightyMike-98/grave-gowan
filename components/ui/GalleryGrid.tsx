'use client';

/**
 * @file components/ui/GalleryGrid.tsx
 * @description Masonry-Layout Galerie mit Framer Motion Lightbox und Favoriten-Toggle.
 *
 * Matches gentle-code-mover's GalleryTab exakt:
 * - Masonry 2→3 columns
 * - Hover: gradient overlay + caption
 * - Click: AnimatePresence lightbox mit motion.img scale 0.95→1
 * - Stagger animation on gallery items
 *
 * NEU: Favoriten-Toggle (Herz-Icon) für Owner/Editor.
 * Markierte Fotos bekommen einen goldenen Stern und werden in Highlights verwendet.
 */

import type { Photo } from '@/types';
import { AnimatePresence, motion } from 'framer-motion';
import Image from 'next/image';
import { useState } from 'react';

const fadeIn = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } },
};

const stagger = {
    visible: { transition: { staggerChildren: 0.08 } },
};

interface GalleryGridProps {
    photos: Photo[];
    canEdit?: boolean;
    /** IDs der als Favorit markierten Fotos. */
    favoriteIds?: string[];
    /** Callback wenn ein Foto favorisiert/entfavorisiert wird. */
    onToggleFavorite?: (photoId: string) => void;
}

export function GalleryGrid({ photos, canEdit = false, favoriteIds = [], onToggleFavorite }: GalleryGridProps) {
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

    return (
        <>
            <motion.section
                aria-label="Gallery"
                className="py-10"
                initial="hidden"
                animate="visible"
                variants={stagger}
            >
                <motion.div variants={fadeIn} className="mb-6 space-y-1">
                    <h2 className="text-3xl tracking-tight" style={{ color: 'hsl(var(--foreground))' }}>Gallery</h2>
                    {canEdit && (
                        <p className="text-sm font-light mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
                            Füge Fotos hinzu, die das Leben erzählen. Markiere Favoriten mit ⭐ für die Highlights.
                        </p>
                    )}
                </motion.div>

                {photos.length === 0 ? (
                    <motion.p variants={fadeIn} className="italic font-light" style={{ color: 'hsl(var(--muted-foreground))' }}>
                        {canEdit ? 'No photos added yet.' : 'No photos yet.'}
                    </motion.p>
                ) : (
                    <div className="columns-2 gap-3 space-y-3 md:columns-3">
                        {photos.map((photo, index) => {
                            const isFavorite = favoriteIds.includes(photo.id);
                            return (
                                <motion.div
                                    key={photo.id}
                                    variants={fadeIn}
                                    className="group relative cursor-pointer overflow-hidden rounded-lg break-inside-avoid"
                                    onClick={() => setLightboxIndex(index)}
                                >
                                    <Image
                                        src={photo.url}
                                        alt={photo.caption || 'Memorial photo'}
                                        width={600}
                                        height={600}
                                        className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105"
                                        sizes="(max-width: 768px) 50vw, 33vw"
                                    />
                                    {/* Hover gradient overlay */}
                                    <div
                                        className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                                        style={{ background: 'linear-gradient(to top, hsl(var(--foreground) / 0.4), transparent, transparent)' }}
                                    />
                                    <p
                                        className="absolute bottom-0 left-0 right-0 p-3 text-xs font-light opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                                        style={{ color: 'hsl(var(--primary-foreground))' }}
                                    >
                                        {photo.caption}
                                    </p>

                                    {/* Favorite toggle — nur für Owner/Editor sichtbar */}
                                    {canEdit && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onToggleFavorite?.(photo.id);
                                            }}
                                            className="absolute top-1.5 right-1.5 z-10 flex items-center justify-center rounded-full p-1.5 transition-colors hover:bg-foreground/10"
                                            title="Toggle Highlight"
                                        >
                                            <svg className="h-4 w-4 transition-colors" fill={isFavorite ? "hsl(45 93% 55%)" : "none"} viewBox="0 0 24 24" stroke={isFavorite ? "hsl(45 93% 55%)" : "hsl(var(--primary-foreground) / 0.5)"} strokeWidth={1.5}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                                            </svg>
                                        </button>
                                    )}

                                    {/* Favorite indicator (immer sichtbar wenn markiert) */}
                                    {isFavorite && !canEdit && (
                                        <div
                                            className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full"
                                            style={{ backgroundColor: 'hsl(45 93% 55% / 0.9)' }}
                                        >
                                            <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                            </svg>
                                        </div>
                                    )}
                                </motion.div>
                            );
                        })}
                        {canEdit && (
                            <motion.button
                                variants={fadeIn}
                                className="aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-1 transition-colors hover:bg-foreground/5"
                                style={{ borderColor: 'hsl(var(--border) / 0.4)', backgroundColor: 'hsl(var(--muted) / 0.1)' }}
                            >
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} style={{ color: 'hsl(var(--muted-foreground) / 0.4)' }}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                </svg>
                                <span className="text-[10px] font-light" style={{ color: 'hsl(var(--muted-foreground) / 0.5)' }}>Hinzufügen</span>
                            </motion.button>
                        )}
                    </div>
                )}
            </motion.section>

            {/* Lightbox */}
            <AnimatePresence>
                {lightboxIndex !== null && photos[lightboxIndex] && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
                        style={{ backgroundColor: 'hsl(var(--foreground) / 0.9)' }}
                        onClick={() => setLightboxIndex(null)}
                    >
                        <button
                            className="absolute right-4 top-4 rounded-full p-2 transition-colors"
                            style={{ color: 'hsl(var(--primary-foreground) / 0.7)' }}
                            onClick={() => setLightboxIndex(null)}
                        >
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        <motion.div
                            key={lightboxIndex}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.3 }}
                            className="relative max-h-[85vh] max-w-[90vw] rounded-lg overflow-hidden shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <Image
                                src={photos[lightboxIndex].url}
                                alt={photos[lightboxIndex].caption || 'Gallery photo'}
                                width={1200}
                                height={900}
                                className="max-h-[85vh] w-auto object-contain"
                                sizes="90vw"
                            />
                        </motion.div>

                        {photos[lightboxIndex].caption && (
                            <p
                                className="absolute bottom-6 text-sm font-light"
                                style={{ color: 'hsl(var(--primary-foreground) / 0.7)' }}
                            >
                                {photos[lightboxIndex].caption}
                            </p>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
