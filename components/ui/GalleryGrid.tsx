'use client';

/**
 * @file components/ui/GalleryGrid.tsx
 * @description Masonry-Layout Galerie mit Framer Motion Lightbox.
 *
 * Matches gentle-code-mover's GalleryTab exakt:
 * - Masonry 2→3 columns
 * - Hover: gradient overlay + caption
 * - Click: AnimatePresence lightbox mit motion.img scale 0.95→1
 * - Stagger animation on gallery items
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
}

export function GalleryGrid({ photos, canEdit = false }: GalleryGridProps) {
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
                <div className="flex items-center justify-between mb-6">
                    <motion.h2 variants={fadeIn} className="text-3xl tracking-tight">Gallery</motion.h2>
                    {canEdit && (
                        <motion.button
                            variants={fadeIn}
                            className="text-sm font-light rounded-full px-4 py-2 transition-colors"
                            style={{
                                color: 'hsl(var(--foreground))',
                                border: '1px solid hsl(var(--border) / 0.6)',
                            }}
                        >
                            + Add Photo
                        </motion.button>
                    )}
                </div>

                {photos.length === 0 ? (
                    <motion.p variants={fadeIn} className="italic font-light" style={{ color: 'hsl(var(--muted-foreground))' }}>
                        {canEdit ? 'No photos added yet.' : 'No photos yet.'}
                    </motion.p>
                ) : (
                    <div className="columns-2 gap-3 space-y-3 md:columns-3">
                        {photos.map((photo, index) => (
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
                                {/* Hover gradient overlay — exactly like gentle-code-mover */}
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
                            </motion.div>
                        ))}
                    </div>
                )}
            </motion.section>

            {/* Lightbox — AnimatePresence + motion.img scale 0.95→1 (gentle-code-mover exact) */}
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
