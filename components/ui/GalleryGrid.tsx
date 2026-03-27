'use client';

/**
 * @file components/ui/GalleryGrid.tsx
 * @description Masonry-Layout Galerie mit Lightbox, Upload und Favoriten-Toggle.
 */

import type { Photo } from '@/types';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { useCallback, useRef, useState } from 'react';

const LONG_PRESS_MS = 700;

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
    memorialId?: string;
    /** IDs der als Favorit markierten Fotos. */
    favoriteIds?: string[];
    /** Callback wenn ein Foto favorisiert/entfavorisiert wird. */
    onToggleFavorite?: (photoId: string) => void;
    /** Callback wenn ein neues Foto hochgeladen wurde. */
    onPhotoUploaded?: (photo: Photo) => void;
    /** Callback wenn ein Foto gelöscht wurde. */
    onDeletePhoto?: (photoId: string) => void;
}

export function GalleryGrid({ photos, canEdit = false, memorialId, favoriteIds = [], onToggleFavorite, onPhotoUploaded, onDeletePhoto }: GalleryGridProps) {
    const t = useTranslations('gallery');
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
    const [uploading, setUploading] = useState(false);
    const [pressingId, setPressingId] = useState<string | null>(null);
    const [confirmId, setConfirmId] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const longPressTriggered = useRef(false);

    const startPress = useCallback((photoId: string) => {
        if (!canEdit || confirmId) return;
        longPressTriggered.current = false;
        setPressingId(photoId);
        pressTimer.current = setTimeout(() => {
            longPressTriggered.current = true;
            setPressingId(null);
            setConfirmId(photoId);
        }, LONG_PRESS_MS);
    }, [canEdit, confirmId]);

    const cancelPress = useCallback(() => {
        if (pressTimer.current) clearTimeout(pressTimer.current);
        pressTimer.current = null;
        setPressingId(null);
    }, []);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !memorialId) return;

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('memorialId', memorialId);

            const res = await fetch('/api/photos/upload', { method: 'POST', body: formData });
            const data = await res.json();

            if (res.ok && data.photo) {
                onPhotoUploaded?.({
                    id: data.photo.id,
                    url: data.photo.url,
                    caption: data.photo.caption,
                    isFavorite: data.photo.isFavorite,
                });
            } else {
                console.error('[GalleryGrid] Upload error:', data.error);
            }
        } catch (err) {
            console.error('[GalleryGrid] Upload failed:', err);
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <>
            {/* Long-press animation keyframe */}
            <style>{`@keyframes longpress-fill { from { opacity: 0; } to { opacity: 1; } }`}</style>

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
                            {t('editHint')}
                        </p>
                    )}
                </motion.div>

                {photos.length === 0 && !canEdit ? (
                    <motion.p variants={fadeIn} className="italic font-light" style={{ color: 'hsl(var(--muted-foreground))' }}>
                        No photos yet.
                    </motion.p>
                ) : (
                    <div className="columns-2 gap-3 space-y-3 md:columns-3">
                        {photos.map((photo, index) => {
                            const isFavorite = favoriteIds.includes(photo.id);
                            return (
                                <motion.div
                                    key={photo.id}
                                    variants={fadeIn}
                                    className="group relative cursor-pointer overflow-hidden rounded-lg break-inside-avoid select-none"
                                    onClick={() => { if (!longPressTriggered.current) setLightboxIndex(index); }}
                                    onPointerDown={() => startPress(photo.id)}
                                    onPointerUp={cancelPress}
                                    onPointerLeave={cancelPress}
                                    onContextMenu={canEdit ? (e) => e.preventDefault() : undefined}
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

                                    {/* Long-press progress overlay */}
                                    {canEdit && pressingId === photo.id && (
                                        <div
                                            className="absolute inset-0 z-20 pointer-events-none"
                                            style={{
                                                backgroundColor: 'hsl(var(--destructive) / 0.35)',
                                                animation: `longpress-fill ${LONG_PRESS_MS}ms ease-in forwards`,
                                            }}
                                        />
                                    )}

                                    {/* Delete confirmation overlay */}
                                    {canEdit && confirmId === photo.id && (
                                        <div
                                            className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 backdrop-blur-md"
                                            style={{ backgroundColor: 'hsl(var(--background) / 0.85)' }}
                                            onClick={(e) => e.stopPropagation()}
                                            onPointerDown={(e) => e.stopPropagation()}
                                        >
                                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2} style={{ color: 'hsl(var(--muted-foreground))' }}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                            </svg>
                                            <p className="text-[11px] font-light tracking-wide" style={{ color: 'hsl(var(--muted-foreground))' }}>Foto entfernen?</p>
                                            <div className="flex flex-col gap-1.5 w-full px-4">
                                                <button
                                                    onClick={() => { setConfirmId(null); onDeletePhoto?.(photo.id); }}
                                                    className="w-full rounded-full py-1.5 text-[11px] font-light tracking-wider transition-all"
                                                    style={{ backgroundColor: 'hsl(var(--foreground))', color: 'hsl(var(--background))' }}
                                                >
                                                    Entfernen
                                                </button>
                                                <button
                                                    onClick={() => setConfirmId(null)}
                                                    className="w-full rounded-full py-1.5 text-[11px] font-light tracking-wider transition-all"
                                                    style={{ color: 'hsl(var(--muted-foreground))' }}
                                                >
                                                    Abbrechen
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Favorite toggle — nur für Owner/Editor sichtbar */}
                                    {canEdit && !confirmId && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onToggleFavorite?.(photo.id);
                                            }}
                                            onPointerDown={(e) => e.stopPropagation()}
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

                        {/* Upload-Button */}
                        {canEdit && (
                            <motion.button
                                variants={fadeIn}
                                className="aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-1 transition-colors hover:bg-foreground/5"
                                style={{ borderColor: 'hsl(var(--border) / 0.4)', backgroundColor: 'hsl(var(--muted) / 0.1)' }}
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploading}
                            >
                                {uploading ? (
                                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" style={{ color: 'hsl(var(--muted-foreground) / 0.4)' }} />
                                ) : (
                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} style={{ color: 'hsl(var(--muted-foreground) / 0.4)' }}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                    </svg>
                                )}
                                <span className="text-[10px] font-light" style={{ color: 'hsl(var(--muted-foreground) / 0.5)' }}>
                                    {uploading ? t('uploading') : t('add')}
                                </span>
                            </motion.button>
                        )}
                    </div>
                )}

                {/* Hidden file input */}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    onChange={handleUpload}
                />
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
