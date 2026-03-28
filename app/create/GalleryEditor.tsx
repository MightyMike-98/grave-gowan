'use client';

import { useTranslations } from 'next-intl';
import { useCallback, useRef, useState } from 'react';

const LONG_PRESS_MS = 700;

interface GalleryPhoto {
    id: string;
    url: string;
    favorite: boolean;
}

interface GalleryEditorProps {
    photos: GalleryPhoto[];
    uploading: boolean;
    onUpload: (file: File) => void;
    onToggleFavorite: (photoId: string) => void;
    onDelete: (photoId: string) => void;
}

export function GalleryEditor({ photos, uploading, onUpload, onToggleFavorite, onDelete }: GalleryEditorProps) {
    const t = useTranslations('create');
    const [pressingId, setPressingId] = useState<string | null>(null);
    const [confirmId, setConfirmId] = useState<string | null>(null);
    const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

                        {/* Long-press progress overlay */}
                        {pressingId === photo.id && (
                            <div
                                className="absolute inset-0 z-20 pointer-events-none"
                                style={{
                                    backgroundColor: 'hsl(var(--destructive) / 0.35)',
                                    animation: `longpress-fill ${LONG_PRESS_MS}ms ease-in forwards`,
                                }}
                            />
                        )}

                        {/* Delete confirmation overlay */}
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

                        {/* Favorite toggle */}
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
                <label
                    className="aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer hover:bg-foreground/5"
                    style={{ borderColor: 'hsl(var(--border) / 0.4)', backgroundColor: 'hsl(var(--muted) / 0.1)' }}
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
                    <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        className="hidden"
                        onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) onUpload(file);
                            e.target.value = '';
                        }}
                    />
                </label>
            </div>
        </section>
    );
}
