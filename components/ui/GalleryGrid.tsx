'use client';

/**
 * @file components/ui/GalleryGrid.tsx
 * @description Masonry-Layout Galerie mit Lightbox, Upload, Favoriten-Toggle und Paywall.
 *
 * Memorial-Ansicht: "Bearbeiten"-Button schaltet editMode ein/aus.
 * Im editMode: Stern (Favorit) links oben, Papierkorb rechts oben auf jedem Bild.
 * Lösch-Bestätigung als Overlay mit Backdrop-Blur.
 *
 * Free: 10 Bilder, keine Videos.
 * Premium (pro Memorial): unbegrenzte Bilder + Videos.
 */

import type { Photo } from '@/types';
import { AnimatePresence, motion } from 'framer-motion';
import { Star, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { useRef, useState } from 'react';

const FREE_PHOTO_LIMIT = 10;

function isVideoUrl(url: string): boolean {
    return /\.(mp4|mov|webm)(\?|$)/i.test(url);
}

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
    memorialSlug?: string;
    isPremium?: boolean;
    favoriteIds?: string[];
    onToggleFavorite?: (photoId: string) => void;
    onPhotoUploaded?: (photo: Photo) => void;
    onDeletePhoto?: (photoId: string) => void;
    heading?: string;
}

export function GalleryGrid({ photos, canEdit = false, memorialId, isPremium = false, favoriteIds = [], onToggleFavorite, onPhotoUploaded, onDeletePhoto, heading }: GalleryGridProps) {
    const t = useTranslations('gallery');
    const tPay = useTranslations('paywall');
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [editMode, setEditMode] = useState(false);
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
    const [showPaywall, setShowPaywall] = useState<'photo' | 'video' | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const atLimit = !isPremium && photos.length >= FREE_PHOTO_LIMIT;

    const trackLead = (triggerType: string) => {
        fetch('/api/premium-lead', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ triggerType, memorialId }),
        }).catch(() => {});
    };

    const handleUploadClick = () => {
        if (atLimit) {
            setShowPaywall('photo');
            trackLead('photo_limit');
            return;
        }
        fileInputRef.current?.click();
    };

    const uploadSingleFile = (file: File): Promise<void> => {
        return new Promise((resolve) => {
            const formData = new FormData();
            formData.append('file', file);
            if (memorialId) formData.append('memorialId', memorialId);

            const xhr = new XMLHttpRequest();
            xhr.upload.addEventListener('progress', (ev) => {
                if (ev.lengthComputable) setUploadProgress(Math.round((ev.loaded / ev.total) * 100));
            });
            xhr.addEventListener('load', () => {
                try {
                    const data = JSON.parse(xhr.responseText);
                    if (xhr.status >= 200 && xhr.status < 300 && data.photo) {
                        onPhotoUploaded?.({
                            id: data.photo.id,
                            url: data.photo.url,
                            caption: data.photo.caption,
                            isFavorite: data.photo.isFavorite,
                        });
                    } else {
                        console.error('[GalleryGrid] Upload error:', data.error);
                    }
                } catch (err) { console.error('[GalleryGrid] Parse error:', err); }
                finally { resolve(); }
            });
            xhr.addEventListener('error', () => {
                console.error('[GalleryGrid] Upload failed');
                resolve();
            });
            xhr.open('POST', '/api/photos/upload');
            xhr.send(formData);
        });
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files ?? []);
        if (files.length === 0 || !memorialId) return;

        // Video without premium → block
        if (!isPremium && files.some(f => f.type.startsWith('video/'))) {
            setShowPaywall('video');
            trackLead('video_upload');
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        // Filter files against photo-count limit (non-premium)
        const toUpload: File[] = [];
        let currentCount = photos.length;
        for (const file of files) {
            if (!isPremium && currentCount >= FREE_PHOTO_LIMIT) {
                setShowPaywall('photo');
                trackLead('photo_limit');
                break;
            }
            toUpload.push(file);
            currentCount++;
        }

        if (toUpload.length === 0) {
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        setUploading(true);
        setUploadProgress(0);
        for (const file of toUpload) {
            await uploadSingleFile(file);
        }
        setUploading(false);
        setUploadProgress(0);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <>
            <motion.section
                aria-label="Gallery"
                className="py-10"
                initial="hidden"
                animate="visible"
                variants={stagger}
            >
                <motion.div variants={fadeIn} className="mb-6 flex items-center justify-between">
                    {heading && <h2 className="text-3xl tracking-tight mb-5">{heading}</h2>}
                    <div className="flex items-center justify-end">
                    {canEdit && (
                        <motion.button
                            variants={fadeIn}
                            onClick={() => { setEditMode(!editMode); setDeleteConfirmId(null); }}
                            className="rounded-full px-3 py-1 text-xs font-light transition-colors"
                            style={{
                                backgroundColor: editMode ? 'hsl(var(--primary))' : 'hsl(var(--muted))',
                                color: editMode ? 'hsl(var(--primary-foreground))' : 'hsl(var(--muted-foreground))',
                            }}
                        >
                            {editMode ? t('done') : t('edit')}
                        </motion.button>
                    )}
                    </div>
                </motion.div>

                {photos.length === 0 && !canEdit ? (
                    <motion.p variants={fadeIn} className="italic font-light" style={{ color: 'hsl(var(--muted-foreground))' }}>
                        {t('noPhotos')}
                    </motion.p>
                ) : (
                    <div className="columns-2 gap-3 space-y-3 md:columns-3">
                        <AnimatePresence mode="popLayout">
                            {photos.map((photo, index) => {
                                const isFavorite = favoriteIds.includes(photo.id);
                                return (
                                    <motion.div
                                        key={photo.id}
                                        layout
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.7, transition: { duration: 0.3 } }}
                                        className="group relative cursor-pointer overflow-hidden rounded-lg break-inside-avoid"
                                        onClick={() => !editMode && deleteConfirmId === null && setLightboxIndex(index)}
                                    >
                                        {isVideoUrl(photo.url) ? (
                                            <video
                                                src={photo.url}
                                                className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105"
                                                muted
                                                loop
                                                playsInline
                                                preload="metadata"
                                                onMouseEnter={(e) => e.currentTarget.play().catch(() => {})}
                                                onMouseLeave={(e) => { e.currentTarget.pause(); e.currentTarget.currentTime = 0; }}
                                            />
                                        ) : (
                                            <Image
                                                src={photo.url}
                                                alt={photo.caption || 'Memorial photo'}
                                                width={600}
                                                height={600}
                                                className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105"
                                                sizes="(max-width: 768px) 50vw, 33vw"
                                            />
                                        )}
                                        {isVideoUrl(photo.url) && (
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

                                        {/* Edit mode: Favorite + Delete buttons */}
                                        {editMode && (
                                            <>
                                                <motion.button
                                                    initial={{ opacity: 0, scale: 0.5 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 0.5 }}
                                                    onClick={(e) => { e.stopPropagation(); onToggleFavorite?.(photo.id); }}
                                                    className="absolute top-2 left-2 z-10 rounded-full p-1.5 shadow-sm backdrop-blur-sm transition-colors"
                                                    style={{ backgroundColor: 'hsl(var(--background) / 0.8)' }}
                                                >
                                                    <Star
                                                        className={`h-4 w-4 transition-colors ${isFavorite ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/50'}`}
                                                        strokeWidth={1.5}
                                                    />
                                                </motion.button>
                                                <motion.button
                                                    initial={{ opacity: 0, scale: 0.5 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 0.5 }}
                                                    onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(photo.id); }}
                                                    className="absolute top-2 right-2 z-10 rounded-full p-1.5 shadow-sm backdrop-blur-sm transition-colors hover:bg-destructive/20"
                                                    style={{ backgroundColor: 'hsl(var(--background) / 0.8)' }}
                                                >
                                                    <Trash2 className="h-4 w-4 text-destructive/70" strokeWidth={1.5} />
                                                </motion.button>
                                            </>
                                        )}

                                        {/* Delete confirmation overlay */}
                                        <AnimatePresence>
                                            {deleteConfirmId === photo.id && (
                                                <motion.div
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    exit={{ opacity: 0 }}
                                                    className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 backdrop-blur-sm"
                                                    style={{ backgroundColor: 'hsl(var(--background) / 0.9)' }}
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <p className="text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>{t('deleteConfirm')}</p>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => { setDeleteConfirmId(null); onDeletePhoto?.(photo.id); }}
                                                            className="rounded-full px-4 py-1.5 text-xs font-light transition-colors"
                                                            style={{ backgroundColor: 'hsl(var(--destructive))', color: 'hsl(var(--destructive-foreground))' }}
                                                        >
                                                            {t('deleteYes')}
                                                        </button>
                                                        <button
                                                            onClick={() => setDeleteConfirmId(null)}
                                                            className="rounded-full px-4 py-1.5 text-xs font-light transition-colors"
                                                            style={{ border: '1px solid hsl(var(--border))', color: 'hsl(var(--muted-foreground))' }}
                                                        >
                                                            {t('deleteCancel')}
                                                        </button>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        {/* Favorite badge (view mode only) */}
                                        {isFavorite && !editMode && (
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
                        </AnimatePresence>

                        {/* Upload-Button (only in edit mode) */}
                        {canEdit && editMode && (
                            <motion.div variants={fadeIn} className="break-inside-avoid pt-1">
                            <button
                                className="relative w-full flex items-center justify-center gap-2 rounded-xl py-3 px-4 overflow-hidden transition-all duration-200 hover:shadow-md"
                                style={{
                                    backgroundColor: 'hsl(var(--card))',
                                    border: '1px solid hsl(var(--border) / 0.5)',
                                    color: 'hsl(var(--muted-foreground))',
                                }}
                                onClick={handleUploadClick}
                                disabled={uploading}
                            >
                                {uploading ? (
                                    <>
                                        <motion.div
                                            className="absolute inset-y-0 left-0"
                                            style={{ backgroundColor: 'hsl(var(--primary) / 0.08)' }}
                                            initial={{ width: 0 }}
                                            animate={{ width: `${uploadProgress}%` }}
                                            transition={{ type: 'spring', stiffness: 120, damping: 20 }}
                                        />
                                        <motion.div
                                            className="absolute bottom-0 left-0 h-[2px]"
                                            style={{ backgroundColor: 'hsl(var(--primary))' }}
                                            initial={{ width: 0 }}
                                            animate={{ width: `${uploadProgress}%` }}
                                            transition={{ type: 'spring', stiffness: 120, damping: 20 }}
                                        />
                                        <motion.span
                                            className="relative z-10 text-xs font-light tabular-nums"
                                            style={{ color: 'hsl(var(--primary))' }}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ duration: 0.3 }}
                                        >
                                            {uploadProgress}%
                                        </motion.span>
                                    </>
                                ) : (
                                    <>
                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                        </svg>
                                        <span className="text-xs font-light">
                                            {t('add')}
                                        </span>
                                        {!isPremium && (
                                            <span className="text-[10px] font-light" style={{ color: 'hsl(var(--muted-foreground) / 0.4)' }}>
                                                {photos.length}/{FREE_PHOTO_LIMIT}
                                            </span>
                                        )}
                                    </>
                                )}
                            </button>
                            </motion.div>
                        )}
                    </div>
                )}

                {/* Hidden file input */}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/quicktime,video/webm"
                    multiple
                    className="hidden"
                    onChange={handleUpload}
                />
            </motion.section>

            {/* Paywall Overlay */}
            <AnimatePresence>
                {showPaywall && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
                        style={{ backgroundColor: 'hsl(var(--background) / 0.7)' }}
                        onClick={() => setShowPaywall(null)}
                    >
                        <motion.div
                            initial={{ opacity: 0, y: 30, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 30, scale: 0.95 }}
                            transition={{ duration: 0.3, ease: 'easeOut' }}
                            className="w-full max-w-sm rounded-2xl p-8 shadow-xl text-center space-y-4"
                            style={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border) / 0.4)' }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div
                                className="mx-auto flex h-14 w-14 items-center justify-center rounded-full"
                                style={{ backgroundColor: 'hsl(var(--primary) / 0.1)' }}
                            >
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} style={{ color: 'hsl(var(--primary))' }}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
                                </svg>
                            </div>

                            <h3 className="text-lg font-medium tracking-tight" style={{ color: 'hsl(var(--foreground))' }}>
                                {showPaywall === 'video' ? tPay('videoUpload') : tPay('photoLimit')}
                            </h3>
                            <p className="text-sm font-light" style={{ color: 'hsl(var(--muted-foreground))' }}>
                                {tPay('comingSoon')}
                            </p>

                            <div className="flex flex-col gap-2 pt-2">
                                <button
                                    onClick={() => setShowPaywall(null)}
                                    className="w-full rounded-full py-3 text-xs font-normal uppercase tracking-[0.2em] text-center shadow-sm transition-shadow duration-300 hover:shadow-md"
                                    style={{ backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
                                >
                                    {tPay('notifyMe')}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

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
                            className="relative h-[75vh] w-[75vw] max-w-3xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {isVideoUrl(photos[lightboxIndex].url) ? (
                                <video
                                    src={photos[lightboxIndex].url}
                                    className="absolute inset-0 h-full w-full object-contain"
                                    controls
                                    autoPlay
                                    playsInline
                                />
                            ) : (
                                <Image
                                    src={photos[lightboxIndex].url}
                                    alt={photos[lightboxIndex].caption || 'Gallery photo'}
                                    fill
                                    className="object-contain"
                                    sizes="70vw"
                                    quality={100}
                                    unoptimized
                                />
                            )}
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
