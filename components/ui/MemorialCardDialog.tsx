'use client';

/**
 * @file components/ui/MemorialCardDialog.tsx
 * @description Inline-Modal auf der Memorial-Seite: rendert die Memorial-Card
 * (1:1 oder 9:16) mit den Daten dieses Memorials und bietet Share / PNG-Download.
 *
 * Im Gegensatz zum Card-Generator führt der "Get Memorial Card"-Button hier
 * NICHT zu /card-generator, sondern öffnet dieses Dialog direkt.
 */

import { AnimatePresence, motion } from 'framer-motion';
import { toPng } from 'html-to-image';
import { Download, Share2, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRef, useState } from 'react';
import { toast, Toaster } from 'sonner';

interface MemorialCardDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    name: string;
    birth: string;
    death: string;
    place: string;
    quote: string;
    photo: string;
    candleCount: number;
}

type Format = '1:1' | '9:16';

export function MemorialCardDialog({ open, onOpenChange, name, birth, death, place, quote, photo, candleCount }: MemorialCardDialogProps) {
    const t = useTranslations('cardGenerator');
    const [format, setFormat] = useState<Format>('1:1');
    const [busy, setBusy] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);
    const isStory = format === '9:16';

    const generate = async () => {
        if (!cardRef.current) return null;
        return await toPng(cardRef.current, {
            cacheBust: true,
            pixelRatio: 2,
            backgroundColor: '#e3e2e0',
        });
    };

    const handleDownload = async () => {
        setBusy(true);
        try {
            const dataUrl = await generate();
            if (!dataUrl) return;
            const link = document.createElement('a');
            link.download = `memorial-${name.toLowerCase().replace(/\s+/g, '-')}-${format.replace(':', 'x')}.png`;
            link.href = dataUrl;
            link.click();
            toast.success(t('toastDownloaded'));
        } catch {
            toast.error(t('toastDownloadFailed'));
        } finally {
            setBusy(false);
        }
    };

    const handleShare = async () => {
        setBusy(true);
        try {
            const dataUrl = await generate();
            if (!dataUrl) return;
            const blob = await (await fetch(dataUrl)).blob();
            const file = new File([blob], `memorial-${name.toLowerCase().replace(/\s+/g, '-')}.png`, { type: 'image/png' });
            const shareText = t('shareText', { name, birth, death });

            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({ files: [file], title: `Memorial · ${name}`, text: shareText });
                toast.success(t('toastShared'));
            } else if (navigator.share) {
                await navigator.share({ title: `Memorial · ${name}`, text: shareText, url: 'https://memorialyard.com' });
                toast.success(t('toastLinkShared'));
            } else {
                await navigator.clipboard.writeText(shareText);
                const link = document.createElement('a');
                link.download = file.name;
                link.href = dataUrl;
                link.click();
                toast.success(t('toastDesktopFallback'));
            }
        } catch (err) {
            const e = err as { name?: string };
            if (e?.name !== 'AbortError') toast.error(t('toastShareFailed'));
        } finally {
            setBusy(false);
        }
    };

    return (
        <>
            <Toaster position="top-center" />
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
                        style={{ backgroundColor: 'hsl(var(--foreground) / 0.6)' }}
                        onClick={() => onOpenChange(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, y: 20, scale: 0.96 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 20, scale: 0.96 }}
                            transition={{ duration: 0.25, ease: 'easeOut' }}
                            className="relative w-full max-w-md rounded-2xl p-5 shadow-2xl max-h-[95vh] overflow-y-auto"
                            style={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border) / 0.4)' }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                type="button"
                                onClick={() => onOpenChange(false)}
                                className="absolute right-3 top-3 rounded-full p-1.5 transition-colors hover:bg-foreground/10"
                                style={{ color: 'hsl(var(--muted-foreground))' }}
                                aria-label="Close"
                            >
                                <X className="h-4 w-4" />
                            </button>

                            <h3
                                className="text-center text-xl font-light tracking-tight"
                                style={{ fontFamily: 'Cormorant Garamond, serif', color: 'hsl(var(--foreground))' }}
                            >
                                Memorial Card
                            </h3>

                            {/* Format toggle */}
                            <div
                                className="mx-auto mt-3 flex w-fit items-center gap-1 rounded-full p-1"
                                style={{ border: '1px solid hsl(var(--border) / 0.4)', backgroundColor: 'hsl(var(--muted) / 0.3)' }}
                            >
                                <button
                                    type="button"
                                    onClick={() => setFormat('1:1')}
                                    className="rounded-full px-4 py-1.5 text-xs font-light transition-all"
                                    style={format === '1:1' ? { backgroundColor: 'hsl(var(--foreground))', color: 'hsl(var(--background))' } : { color: 'hsl(var(--muted-foreground))', backgroundColor: 'transparent' }}
                                >
                                    {t('format11')}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormat('9:16')}
                                    className="rounded-full px-4 py-1.5 text-xs font-light transition-all"
                                    style={format === '9:16' ? { backgroundColor: 'hsl(var(--foreground))', color: 'hsl(var(--background))' } : { color: 'hsl(var(--muted-foreground))', backgroundColor: 'transparent' }}
                                >
                                    {t('format916')}
                                </button>
                            </div>

                            {/* Card preview (scaled to fit modal) */}
                            <div className="mt-4 flex justify-center">
                                <div
                                    style={{
                                        transform: isStory ? 'scale(0.65)' : 'scale(0.7)',
                                        transformOrigin: 'top left',
                                        height: isStory ? 640 * 0.65 : 560 * 0.7,
                                        width: isStory ? 360 * 0.65 : 560 * 0.7,
                                    }}
                                >
                                    <div
                                        ref={cardRef}
                                        className="relative overflow-hidden rounded-[28px] shadow-2xl"
                                        style={{
                                            width: isStory ? 360 : 560,
                                            height: isStory ? 640 : 560,
                                            background: `linear-gradient(180deg, hsl(230 35% 88% / 0.85) 0%, hsl(225 20% 90% / 0.95) 40%, hsl(35 15% 89%) 100%)`,
                                            fontFamily: "'Cormorant Garamond', serif",
                                        }}
                                    >
                                        <div className="flex h-full flex-col items-center px-7 py-7 text-center">
                                            <p className="text-[10px] uppercase tracking-[0.4em] text-slate-600/80" style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 500, letterSpacing: '0.4em' }}>
                                                MemorialYard
                                            </p>

                                            <div
                                                className="mt-4 shrink-0 overflow-hidden rounded-full border-4 border-white/80 shadow-md"
                                                style={{ width: isStory ? 128 : 140, height: isStory ? 128 : 140 }}
                                            >
                                                {photo ? (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img
                                                        src={photo}
                                                        alt=""
                                                        crossOrigin="anonymous"
                                                        className="h-full w-full object-cover"
                                                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                                    />
                                                ) : (
                                                    <div className="h-full w-full bg-slate-300" />
                                                )}
                                            </div>

                                            <h2 className="mt-4 text-4xl text-slate-900" style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 500, letterSpacing: '-0.01em' }}>
                                                {name}
                                            </h2>

                                            <p className="mt-1.5 text-base tracking-wide text-slate-700" style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400 }}>
                                                {birth} – {death}
                                            </p>
                                            {place && (
                                                <p className="mt-0.5 text-xs text-slate-600" style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400 }}>
                                                    ✦ {place}
                                                </p>
                                            )}

                                            <div className="my-3 h-px w-12 bg-slate-400/40" />

                                            <p className="text-[10px] uppercase tracking-[0.3em] text-slate-600/80" style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 500 }}>
                                                {t('inLovingMemory')}
                                            </p>

                                            {quote && (
                                                <p className="mt-3 px-2 text-base italic leading-snug text-slate-800" style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400 }}>
                                                    „{quote}"
                                                </p>
                                            )}

                                            <div className="flex flex-col items-center gap-1.5" style={{ marginTop: isStory ? 36 : 24 }}>
                                                <div className="relative flex items-center justify-center" style={{ width: 80, height: 80 }}>
                                                    {/* Glow als radial-gradient — html-to-image-sicher */}
                                                    <div
                                                        style={{
                                                            position: 'absolute',
                                                            inset: 0,
                                                            background: 'radial-gradient(circle, rgba(251, 191, 36, 0.45) 0%, rgba(251, 191, 36, 0.15) 35%, rgba(251, 191, 36, 0) 70%)',
                                                        }}
                                                    />
                                                    <div
                                                        className="relative flex items-center justify-center rounded-full"
                                                        style={{ width: 48, height: 48, backgroundColor: 'rgba(254, 243, 199, 0.95)' }}
                                                    >
                                                        <svg
                                                            width="22"
                                                            height="22"
                                                            viewBox="0 0 24 24"
                                                            fill="rgb(245, 158, 11)"
                                                            stroke="rgb(245, 158, 11)"
                                                            strokeWidth="1.5"
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                        >
                                                            <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
                                                        </svg>
                                                    </div>
                                                </div>
                                                <p className="text-[11px] text-slate-700" style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 500 }}>
                                                    {candleCount} {candleCount === 1 ? t('candleOne') : t('candleMany')}
                                                </p>
                                            </div>

                                            <div className="mt-auto flex flex-col items-center pt-3">
                                                <p className="text-sm text-slate-600" style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 500, letterSpacing: '0.05em' }}>
                                                    memorialyard.com
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                                <button
                                    type="button"
                                    onClick={handleShare}
                                    disabled={busy}
                                    className="flex flex-1 items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-light transition-shadow disabled:opacity-40"
                                    style={{ backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
                                >
                                    <Share2 className="h-4 w-4" />
                                    {t('shareStory')}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleDownload}
                                    disabled={busy}
                                    className="flex flex-1 items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-light transition-colors disabled:opacity-40"
                                    style={{ border: '1px solid hsl(var(--border) / 0.6)', color: 'hsl(var(--foreground))' }}
                                >
                                    <Download className="h-4 w-4" />
                                    {busy ? t('creating') : t('png')}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
