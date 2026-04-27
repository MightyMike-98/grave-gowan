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
import { Download, RectangleVertical, Share2, Smartphone, Square, X } from 'lucide-react';
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

type Format = '1:1' | '4:5' | '9:16';

interface Dims {
    w: number;
    h: number;
    photo: number;
    candleMt: number;
    previewScale: number;
    // Größen-Klassen / -Werte
    brandSize: string;       // header brand
    nameSize: string;        // person name
    dateSize: string;        // birth – death
    placeSize: string;       // place
    labelSize: string;       // "In Loving Memory"
    quoteSize: string;       // italic quote
    footerSize: string;      // memorialyard.com
    candleWrap: number;      // outer wrapper
    candleCircle: number;    // inner colored circle
    candleSvg: number;       // svg flame size
    photoMt: string;         // photo margin-top class
    nameMt: string;          // name margin-top class
    dividerMy: string;       // divider margin-y class
}

const FORMAT_DIMS: Record<Format, Dims> = {
    '1:1':  {
        w: 560, h: 560, photo: 140, candleMt: 0, previewScale: 0.7,
        brandSize: 'text-[12px]', nameSize: 'text-[40px]', dateSize: 'text-lg', placeSize: 'text-sm',
        labelSize: 'text-[12px]', quoteSize: 'text-lg', footerSize: 'text-base',
        candleWrap: 80, candleCircle: 48, candleSvg: 24,
        photoMt: 'mt-3', nameMt: 'mt-4', dividerMy: 'my-2',
    },
    '4:5':  {
        // Memorial-Modal hat zusätzlich die "X Kerzen leuchten"-Zeile unter
        // der Kerze (im Generator nur "Im Gedenken"). Lange Namen (zB "Taha
        // Muhammad Hussein") brechen außerdem auf 2 Zeilen um. Deshalb hier
        // Kerze + Margins etwas kompakter als im Generator, damit
        // memorialyard.com nicht abgeschnitten wird.
        w: 560, h: 700, photo: 190, candleMt: 0, previewScale: 0.55,
        brandSize: 'text-[14px]', nameSize: 'text-[52px]', dateSize: 'text-xl', placeSize: 'text-base',
        labelSize: 'text-[14px]', quoteSize: 'text-xl', footerSize: 'text-base',
        candleWrap: 88, candleCircle: 52, candleSvg: 28,
        photoMt: 'mt-4', nameMt: 'mt-4', dividerMy: 'my-3',
    },
    '9:16': {
        w: 360, h: 640, photo: 160, candleMt: 8, previewScale: 0.65,
        brandSize: 'text-[12px]', nameSize: 'text-[40px]', dateSize: 'text-lg', placeSize: 'text-sm',
        labelSize: 'text-[12px]', quoteSize: 'text-lg', footerSize: 'text-base',
        candleWrap: 80, candleCircle: 48, candleSvg: 24,
        photoMt: 'mt-3', nameMt: 'mt-4', dividerMy: 'my-2',
    },
};

export function MemorialCardDialog({ open, onOpenChange, name, birth, death, place, quote, photo, candleCount }: MemorialCardDialogProps) {
    const t = useTranslations('cardGenerator');
    const [format, setFormat] = useState<Format>('1:1');
    const [busy, setBusy] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);
    const dims = FORMAT_DIMS[format];

    /**
     * Ersetzt jedes <img> im Card-Container durch eine inline data-URL,
     * damit html-to-image nichts mehr per fetch holen muss. Das eliminiert
     * die Race-Conditions, durch die Bilder beim Capture manchmal leer waren.
     */
    const inlineImages = async () => {
        if (!cardRef.current) return;
        const imgs = Array.from(cardRef.current.querySelectorAll('img'));
        await Promise.all(imgs.map(async (img) => {
            const src = img.src;
            if (!src || src.startsWith('data:')) {
                if (img.complete && img.naturalWidth > 0) {
                    try { await img.decode(); } catch { /* ignore */ }
                }
                return;
            }
            try {
                const response = await fetch(src, { mode: 'cors', cache: 'force-cache' });
                if (!response.ok) return;
                const blob = await response.blob();
                const dataUrl = await new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result as string);
                    reader.onerror = reject;
                    reader.readAsDataURL(blob);
                });
                img.src = dataUrl;
                if (img.decode) {
                    try { await img.decode(); } catch { /* ignore */ }
                }
            } catch (e) {
                console.warn('[MemorialCardDialog] Could not inline image:', e);
            }
        }));
    };

    const generate = async () => {
        if (!cardRef.current) return null;
        // 1. Fonts laden (Cormorant Garamond)
        if (document.fonts && document.fonts.ready) {
            await document.fonts.ready;
        }
        // 2. Alle Bilder zu data-URLs konvertieren — kein fetch mehr in toPng
        await inlineImages();
        // 3. Capture
        return await toPng(cardRef.current, {
            pixelRatio: 3,
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
                                    className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-light transition-all"
                                    style={format === '1:1' ? { backgroundColor: 'hsl(var(--foreground))', color: 'hsl(var(--background))' } : { color: 'hsl(var(--muted-foreground))', backgroundColor: 'transparent' }}
                                >
                                    <Square className="h-3 w-3" /> {t('format11')}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormat('4:5')}
                                    className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-light transition-all"
                                    style={format === '4:5' ? { backgroundColor: 'hsl(var(--foreground))', color: 'hsl(var(--background))' } : { color: 'hsl(var(--muted-foreground))', backgroundColor: 'transparent' }}
                                >
                                    <RectangleVertical className="h-3 w-3" /> {t('format45')}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormat('9:16')}
                                    className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-light transition-all"
                                    style={format === '9:16' ? { backgroundColor: 'hsl(var(--foreground))', color: 'hsl(var(--background))' } : { color: 'hsl(var(--muted-foreground))', backgroundColor: 'transparent' }}
                                >
                                    <Smartphone className="h-3 w-3" /> {t('format916')}
                                </button>
                            </div>

                            {/* Card preview (scaled to fit modal) */}
                            <div className="mt-4 flex justify-center">
                                <div
                                    style={{
                                        transform: `scale(${dims.previewScale})`,
                                        transformOrigin: 'top left',
                                        height: dims.h * dims.previewScale,
                                        width: dims.w * dims.previewScale,
                                    }}
                                >
                                    <div
                                        ref={cardRef}
                                        className="relative overflow-hidden rounded-[28px] shadow-2xl"
                                        style={{
                                            width: dims.w,
                                            height: dims.h,
                                            background: `linear-gradient(180deg, hsl(230 35% 88% / 0.85) 0%, hsl(225 20% 90% / 0.95) 40%, hsl(35 15% 89%) 100%)`,
                                            fontFamily: "'Cormorant Garamond', serif",
                                        }}
                                    >
                                        <div className="flex h-full flex-col items-center px-7 py-5 text-center">
                                            <p className={`${dims.brandSize} uppercase tracking-[0.4em] text-slate-600/80`} style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 500, letterSpacing: '0.4em' }}>
                                                MemorialYard
                                            </p>

                                            <div
                                                className={`${dims.photoMt} shrink-0 overflow-hidden rounded-full border-4 border-white/80`}
                                                style={{ width: dims.photo, height: dims.photo }}
                                            >
                                                {photo ? (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img
                                                        src={photo}
                                                        alt=""
                                                        className="h-full w-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="h-full w-full bg-slate-300" />
                                                )}
                                            </div>

                                            <h2 className={`${dims.nameMt} ${dims.nameSize} leading-tight text-slate-900`} style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 500, letterSpacing: '-0.01em' }}>
                                                {name}
                                            </h2>

                                            <p className={`mt-1.5 ${dims.dateSize} tracking-wide text-slate-700`} style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400 }}>
                                                {birth} – {death}
                                            </p>
                                            {place && (
                                                <p className={`mt-0.5 ${dims.placeSize} text-slate-600`} style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400 }}>
                                                    ✦ {place}
                                                </p>
                                            )}

                                            <div className={`${dims.dividerMy} h-px w-12 bg-slate-400/40`} />

                                            <p className={`${dims.labelSize} uppercase tracking-[0.3em] text-slate-600/80`} style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 500 }}>
                                                {t('inLovingMemory')}
                                            </p>

                                            {quote && (
                                                <p className={`mt-3 px-2 ${dims.quoteSize} italic leading-snug text-slate-800`} style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400 }}>
                                                    „{quote}"
                                                </p>
                                            )}

                                            <div className="flex flex-col items-center gap-0.5" style={{ marginTop: dims.candleMt }}>
                                                <div className="relative flex items-center justify-center" style={{ width: dims.candleWrap, height: dims.candleWrap }}>
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
                                                        style={{ width: dims.candleCircle, height: dims.candleCircle, backgroundColor: 'rgba(254, 243, 199, 0.95)' }}
                                                    >
                                                        <svg
                                                            width={dims.candleSvg}
                                                            height={dims.candleSvg}
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

                                            <div className="mt-auto flex flex-col items-center pt-2">
                                                <p className={`${dims.footerSize} text-slate-600`} style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 500, letterSpacing: '0.05em' }}>
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
