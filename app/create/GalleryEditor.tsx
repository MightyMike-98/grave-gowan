'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Star, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRef, useState } from 'react';

const FREE_PHOTO_LIMIT = 10;
const FREE_SIZE_LIMIT_BYTES = 30 * 1024 * 1024; // 30 MB

function isVideoUrl(url: string): boolean {
    return /\.(mp4|mov|webm)(\?|$)/i.test(url);
}

interface GalleryPhoto {
    id: string;
    url: string;
    favorite: boolean;
    size?: number;
}

interface GalleryEditorProps {
    photos: GalleryPhoto[];
    uploading: boolean;
    uploadProgress?: number;
    isPremium?: boolean;
    memorialId?: string;
    onUpload: (file: File) => Promise<void> | void;
    onToggleFavorite: (photoId: string) => void;
    onDelete: (photoId: string) => void;
}

export function GalleryEditor({ photos, uploading, uploadProgress = 0, isPremium = false, memorialId, onUpload, onToggleFavorite, onDelete }: GalleryEditorProps) {
    const t = useTranslations('create');
    const tPay = useTranslations('paywall');
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
    const [showPaywall, setShowPaywall] = useState<'photo' | 'video' | 'size' | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const totalBytes = photos.reduce((sum, p) => sum + (p.size ?? 0), 0);
    const atLimit = !isPremium && photos.length >= FREE_PHOTO_LIMIT;
    const atSizeLimit = !isPremium && totalBytes >= FREE_SIZE_LIMIT_BYTES;

    const trackLead = (triggerType: string) => {
        fetch('/api/premium-lead', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ triggerType, memorialId }),
        }).catch(() => {});
    };

    const handleUploadClick = () => {
        if (atSizeLimit) {
            setShowPaywall('size');
            trackLead('size_limit');
            return;
        }
        if (atLimit) {
            setShowPaywall('photo');
            trackLead('photo_limit');
            return;
        }
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files ?? []);
        if (files.length === 0) return;

        if (!isPremium && files.some(f => f.type.startsWith('video/'))) {
            setShowPaywall('video');
            trackLead('video_upload');
            e.target.value = '';
            return;
        }

        // Filter files sequentially against count + size limits
        const toUpload: File[] = [];
        let currentCount = photos.length;
        let currentBytes = totalBytes;
        let hitPhotoLimit = false;
        let hitSizeLimit = false;

        for (const file of files) {
            if (!isPremium && currentCount >= FREE_PHOTO_LIMIT) { hitPhotoLimit = true; break; }
            if (!isPremium && (currentBytes + file.size) > FREE_SIZE_LIMIT_BYTES) { hitSizeLimit = true; break; }
            toUpload.push(file);
            currentCount++;
            currentBytes += file.size;
        }

        e.target.value = '';

        for (const file of toUpload) {
            await onUpload(file);
        }

        if (hitPhotoLimit) {
            setShowPaywall('photo');
            trackLead('photo_limit');
        } else if (hitSizeLimit) {
            setShowPaywall('size');
            trackLead('size_limit');
        }
    };

    return (
        <section className="pt-12 space-y-5">
            <div className="mb-8 h-px" style={{ backgroundColor: 'hsl(var(--border) / 0.4)' }} />
            <h2 className="text-xl tracking-tight">{t('sectionGallery')}</h2>
            <p className="text-sm font-light" style={{ color: 'hsl(var(--muted-foreground))' }}>
                {t('galleryHint')}
            </p>

            <div className="grid grid-cols-3 gap-3">
                <AnimatePresence mode="popLayout">
                    {photos.map((photo) => (
                        <motion.div
                            key={photo.id}
                            layout
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.7, transition: { duration: 0.25 } }}
                            className="group relative aspect-square rounded-lg overflow-hidden"
                            style={{ backgroundColor: 'hsl(var(--muted) / 0.2)', border: '1px solid hsl(var(--border) / 0.4)' }}
                        >
                            {isVideoUrl(photo.url) ? (
                                <video
                                    src={`${photo.url}#t=0.1`}
                                    className="h-full w-full object-cover"
                                    muted
                                    loop
                                    playsInline
                                    preload="metadata"
                                    onLoadedMetadata={(e) => { e.currentTarget.currentTime = 0.1; }}
                                    onMouseEnter={(e) => e.currentTarget.play().catch(() => {})}
                                    onMouseLeave={(e) => { e.currentTarget.pause(); e.currentTarget.currentTime = 0.1; }}
                                />
                            ) : (
                                <img src={photo.url} alt="" className="h-full w-full object-cover" loading="lazy" />
                            )}
                            {isVideoUrl(photo.url) && (
                                <div className="pointer-events-none absolute bottom-1.5 right-1.5 transition-opacity duration-300 group-hover:opacity-0">
                                    <svg
                                        className="h-3.5 w-3.5 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]"
                                        fill="white"
                                        viewBox="0 0 24 24"
                                    >
                                        <path d="M8 5v14l11-7z" />
                                    </svg>
                                </div>
                            )}

                            {/* Hover overlay */}
                            <div className="absolute inset-0 transition-colors duration-300 group-hover:bg-foreground/20" />

                            {/* Favorite button — appears on hover */}
                            <button
                                type="button"
                                onClick={() => onToggleFavorite(photo.id)}
                                className="absolute top-1.5 right-1.5 rounded-full p-1 opacity-0 backdrop-blur-sm transition-all duration-200 group-hover:opacity-100"
                                style={{ backgroundColor: 'hsl(var(--background) / 0.7)' }}
                            >
                                <Star
                                    className={`h-3.5 w-3.5 transition-colors ${photo.favorite ? 'fill-amber-400 text-amber-400' : 'text-foreground/60'}`}
                                    strokeWidth={1.5}
                                />
                            </button>

                            {/* Delete button — appears on hover */}
                            <button
                                type="button"
                                onClick={() => setDeleteConfirmId(photo.id)}
                                className="absolute top-1.5 left-1.5 rounded-full p-1 opacity-0 backdrop-blur-sm transition-all duration-200 group-hover:opacity-100 hover:bg-destructive/20"
                                style={{ backgroundColor: 'hsl(var(--background) / 0.7)' }}
                            >
                                <Trash2 className="h-3.5 w-3.5 text-destructive/70" strokeWidth={1.5} />
                            </button>

                            {/* Delete confirmation overlay */}
                            <AnimatePresence>
                                {deleteConfirmId === photo.id && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 backdrop-blur-sm"
                                        style={{ backgroundColor: 'hsl(var(--background) / 0.9)' }}
                                    >
                                        <p className="text-xs font-medium" style={{ color: 'hsl(var(--foreground))' }}>{t('photoRemoveConfirm')}</p>
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={() => { setDeleteConfirmId(null); onDelete(photo.id); }}
                                                className="rounded-full px-3 py-1 text-[10px] font-light transition-colors"
                                                style={{ backgroundColor: 'hsl(var(--destructive))', color: 'hsl(var(--destructive-foreground))' }}
                                            >
                                                {t('photoRemove')}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setDeleteConfirmId(null)}
                                                className="rounded-full px-3 py-1 text-[10px] font-light transition-colors"
                                                style={{ border: '1px solid hsl(var(--border))', color: 'hsl(var(--muted-foreground))' }}
                                            >
                                                {t('photoCancel')}
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {/* Upload button */}
                <button
                    type="button"
                    className="relative aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer overflow-hidden hover:bg-foreground/5"
                    style={{ borderColor: 'hsl(var(--border) / 0.4)', backgroundColor: 'hsl(var(--muted) / 0.1)' }}
                    onClick={handleUploadClick}
                    disabled={uploading}
                >
                    {uploading ? (
                        <>
                            <motion.div
                                className="absolute bottom-0 left-0 right-0"
                                style={{ backgroundColor: 'hsl(var(--primary) / 0.08)' }}
                                initial={{ height: 0 }}
                                animate={{ height: `${uploadProgress}%` }}
                                transition={{ type: 'spring', stiffness: 120, damping: 20 }}
                            />
                            <motion.span
                                className="relative z-10 text-lg font-light tabular-nums"
                                style={{ color: 'hsl(var(--primary))', fontFamily: 'var(--font-serif)' }}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.3 }}
                            >
                                {uploadProgress}%
                            </motion.span>
                            <motion.div
                                className="absolute bottom-0 left-0 h-[2px]"
                                style={{ backgroundColor: 'hsl(var(--primary))' }}
                                initial={{ width: 0 }}
                                animate={{ width: `${uploadProgress}%` }}
                                transition={{ type: 'spring', stiffness: 120, damping: 20 }}
                            />
                        </>
                    ) : (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} style={{ color: 'hsl(var(--muted-foreground) / 0.4)' }}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                    )}
                    {!uploading && (
                        <span className="text-[10px] font-light" style={{ color: 'hsl(var(--muted-foreground) / 0.5)' }}>
                            {t('addButton')}
                        </span>
                    )}
                    {!isPremium && !uploading && (
                        <span className="text-[9px] font-light" style={{ color: 'hsl(var(--muted-foreground) / 0.4)' }}>
                            {photos.length}/{FREE_PHOTO_LIMIT} · {(totalBytes / (1024 * 1024)).toFixed(1)}/30 MB
                        </span>
                    )}
                </button>

                {/* Hidden file input */}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/quicktime,video/webm"
                    multiple
                    className="hidden"
                    onChange={handleFileChange}
                />
            </div>

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
                                {showPaywall === 'video' ? tPay('videoUpload') : showPaywall === 'size' ? tPay('sizeLimit') : tPay('photoLimit')}
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
        </section>
    );
}
