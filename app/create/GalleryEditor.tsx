'use client';

import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useCallback, useRef, useState } from 'react';

const FREE_PHOTO_LIMIT = 10;
const LONG_PRESS_MS = 700;

interface GalleryPhoto {
    id: string;
    url: string;
    favorite: boolean;
}

interface GalleryEditorProps {
    photos: GalleryPhoto[];
    uploading: boolean;
    isPremium?: boolean;
    memorialId?: string;
    onUpload: (file: File) => void;
    onToggleFavorite: (photoId: string) => void;
    onDelete: (photoId: string) => void;
}

export function GalleryEditor({ photos, uploading, isPremium = false, memorialId, onUpload, onToggleFavorite, onDelete }: GalleryEditorProps) {
    const t = useTranslations('create');
    const tPay = useTranslations('paywall');
    const [pressingId, setPressingId] = useState<string | null>(null);
    const [confirmId, setConfirmId] = useState<string | null>(null);
    const [showPaywall, setShowPaywall] = useState<'photo' | 'video' | null>(null);
    const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const atLimit = !isPremium && photos.length >= FREE_PHOTO_LIMIT;

    const startPress = useCallback((photoId: string) => {
        if (confirmId) return;
        setPressingId(photoId);
        pressTimer.current = setTimeout(() => {
            setPressingId(null);
            setConfirmId(photoId);
        }, LONG_PRESS_MS);
    }, [confirmId]);

    const cancelPress = useCallback(() => {
        if (pressTimer.current) clearTimeout(pressTimer.current);
        pressTimer.current = null;
        setPressingId(null);
    }, []);

    const confirmDelete = (photoId: string) => {
        setConfirmId(null);
        onDelete(photoId);
    };

    const handleUploadClick = () => {
        if (atLimit) {
            setShowPaywall('photo');
            return;
        }
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.type.startsWith('video/') && !isPremium) {
            setShowPaywall('video');
            e.target.value = '';
            return;
        }

        if (!file.type.startsWith('video/') && !isPremium && photos.length >= FREE_PHOTO_LIMIT) {
            setShowPaywall('photo');
            e.target.value = '';
            return;
        }

        onUpload(file);
        e.target.value = '';
    };

    return (
        <section className="pt-12 space-y-5">
            <div className="mb-8 h-px" style={{ backgroundColor: 'hsl(var(--border) / 0.4)' }} />
            <style>{`@keyframes longpress-fill { from { opacity: 0; } to { opacity: 1; } }`}</style>
            <h2 className="text-xl tracking-tight">{t('sectionGallery')}</h2>
            <p className="text-sm font-light" style={{ color: 'hsl(var(--muted-foreground))' }}>
                {t('galleryHint')}
            </p>

            <div className="grid grid-cols-3 gap-3">
                {photos.map((photo) => (
                    <div
                        key={photo.id}
                        className="group relative aspect-square rounded-lg overflow-hidden select-none"
                        style={{ backgroundColor: 'hsl(var(--muted) / 0.2)' }}
                        onPointerDown={() => startPress(photo.id)}
                        onPointerUp={cancelPress}
                        onPointerLeave={cancelPress}
                        onContextMenu={(e) => e.preventDefault()}
                    >
                        <img src={photo.url} alt="" className="h-full w-full object-cover" loading="lazy" />

                        {pressingId === photo.id && (
                            <div
                                className="absolute inset-0 z-20 pointer-events-none"
                                style={{
                                    backgroundColor: 'hsl(var(--destructive) / 0.35)',
                                    animation: `longpress-fill ${LONG_PRESS_MS}ms ease-in forwards`,
                                }}
                            />
                        )}

                        {confirmId === photo.id && (
                            <div
                                className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-2.5 backdrop-blur-md"
                                style={{ backgroundColor: 'hsl(var(--background) / 0.85)' }}
                                onPointerDown={(e) => e.stopPropagation()}
                            >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2} style={{ color: 'hsl(var(--muted-foreground))' }}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                </svg>
                                <p className="text-[10px] font-light tracking-wide" style={{ color: 'hsl(var(--muted-foreground))' }}>{t('storyRemoveConfirm')}</p>
                                <div className="flex flex-col gap-1 w-full px-3">
                                    <button
                                        type="button"
                                        onClick={() => confirmDelete(photo.id)}
                                        className="w-full rounded-full py-1 text-[10px] font-light tracking-wider transition-all"
                                        style={{ backgroundColor: 'hsl(var(--foreground))', color: 'hsl(var(--background))' }}
                                    >
                                        {t('storyRemove')}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setConfirmId(null)}
                                        className="w-full rounded-full py-1 text-[10px] font-light tracking-wider transition-all"
                                        style={{ color: 'hsl(var(--muted-foreground))' }}
                                    >
                                        {t('storyCancel')}
                                    </button>
                                </div>
                            </div>
                        )}

                        {!confirmId && (
                            <button
                                type="button"
                                onClick={() => onToggleFavorite(photo.id)}
                                onPointerDown={(e) => e.stopPropagation()}
                                className="absolute top-1.5 right-1.5 z-10 rounded-full p-1 transition-colors hover:bg-foreground/10"
                            >
                                <svg className="h-3.5 w-3.5 transition-colors" fill={photo.favorite ? "hsl(45 93% 55%)" : "none"} viewBox="0 0 24 24" stroke={photo.favorite ? "hsl(45 93% 55%)" : "hsl(var(--primary-foreground) / 0.5)"} strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                                </svg>
                            </button>
                        )}
                    </div>
                ))}

                {/* Upload button */}
                <button
                    type="button"
                    className="aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer hover:bg-foreground/5"
                    style={{ borderColor: 'hsl(var(--border) / 0.4)', backgroundColor: 'hsl(var(--muted) / 0.1)' }}
                    onClick={handleUploadClick}
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
                        {uploading ? t('loading') : t('addButton')}
                    </span>
                    {!isPremium && (
                        <span className="text-[9px] font-light" style={{ color: 'hsl(var(--muted-foreground) / 0.4)' }}>
                            {photos.length}/{FREE_PHOTO_LIMIT}
                        </span>
                    )}
                </button>

                {/* Hidden file input — images + videos */}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/quicktime,video/webm"
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
                                {showPaywall === 'video' ? tPay('videoUpload') : tPay('photoLimit')}
                            </h3>
                            <p className="text-sm font-light" style={{ color: 'hsl(var(--muted-foreground))' }}>
                                {tPay('upgradeHint')}
                            </p>

                            <div className="flex flex-col gap-2 pt-2">
                                <Link
                                    href={`/pricing${memorialId ? `?memorial=${memorialId}` : ''}`}
                                    className="w-full rounded-full py-3 text-xs font-normal uppercase tracking-[0.2em] text-center shadow-sm transition-shadow duration-300 hover:shadow-md"
                                    style={{ backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
                                >
                                    {tPay('upgradeCta')}
                                </Link>
                                <button
                                    onClick={() => setShowPaywall(null)}
                                    className="text-xs font-light transition-colors"
                                    style={{ color: 'hsl(var(--muted-foreground))' }}
                                >
                                    {t('storyCancel')}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    );
}
