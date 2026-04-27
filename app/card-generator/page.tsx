'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { toPng } from 'html-to-image';
import { ArrowLeft, Download, Square, RectangleVertical, Smartphone, Share2, Sparkles, ExternalLink, X } from 'lucide-react';
import { ImageUploader } from '@/components/ui/ImageUploader';
import { toast, Toaster } from 'sonner';
import { useTranslations } from 'next-intl';

type Format = '1:1' | '4:5' | '9:16';

interface Dims {
    w: number;
    h: number;
    photo: number;
    candleMt: number;
    brandSize: string;
    nameSize: string;
    dateSize: string;
    placeSize: string;
    labelSize: string;
    quoteSize: string;
    footerSize: string;
    candleWrap: number;
    candleCircle: number;
    candleSvg: number;
    photoMt: string;
    nameMt: string;
    dividerMy: string;
}

const FORMAT_DIMS: Record<Format, Dims> = {
    '1:1':  {
        w: 560, h: 560, photo: 140, candleMt: 0,
        brandSize: 'text-[12px]', nameSize: 'text-[40px]', dateSize: 'text-lg', placeSize: 'text-sm',
        labelSize: 'text-[12px]', quoteSize: 'text-lg', footerSize: 'text-base',
        candleWrap: 80, candleCircle: 48, candleSvg: 24,
        photoMt: 'mt-3', nameMt: 'mt-4', dividerMy: 'my-2',
    },
    '4:5':  {
        w: 560, h: 700, photo: 200, candleMt: 8,
        brandSize: 'text-[14px]', nameSize: 'text-[52px]', dateSize: 'text-xl', placeSize: 'text-base',
        labelSize: 'text-[14px]', quoteSize: 'text-xl', footerSize: 'text-lg',
        candleWrap: 100, candleCircle: 60, candleSvg: 32,
        photoMt: 'mt-5', nameMt: 'mt-5', dividerMy: 'my-4',
    },
    '9:16': {
        w: 360, h: 640, photo: 160, candleMt: 8,
        brandSize: 'text-[12px]', nameSize: 'text-[40px]', dateSize: 'text-lg', placeSize: 'text-sm',
        labelSize: 'text-[12px]', quoteSize: 'text-lg', footerSize: 'text-base',
        candleWrap: 80, candleCircle: 48, candleSvg: 24,
        photoMt: 'mt-3', nameMt: 'mt-4', dividerMy: 'my-2',
    },
};

type Template = {
    id: string;
    name: string;
    birth: string;
    death: string;
    place: string;
    quote: string;
    photo: string;
};

const templates: Template[] = [
    {
        id: 'mj',
        name: 'Michael Jackson',
        birth: '1958',
        death: '2009',
        place: 'Gary, IN (USA)',
        quote: 'In a world filled with hate, we must still dare to hope.',
        photo: '/michael-jackson.webp',
    },
];

const defaultTpl = templates[0];

const emptyValues = {
    name: '',
    birth: '',
    death: '',
    place: '',
    quote: '',
    photo: '',
};

const inputClass = 'mt-1.5 w-full rounded-md border px-3 py-2 text-sm font-light outline-none transition-colors focus:ring-1';
const inputStyle: React.CSSProperties = {
    borderColor: 'hsl(var(--border) / 0.6)',
    backgroundColor: 'hsl(var(--background))',
    color: 'hsl(var(--foreground))',
};
const labelClass = 'text-[10px] font-normal uppercase tracking-[0.25em]';
const labelStyle: React.CSSProperties = { color: 'hsl(var(--muted-foreground))' };

export default function CardGeneratorPage() {
    return (
        <Suspense fallback={<div className="min-h-screen" style={{ backgroundColor: 'hsl(var(--background))' }} />}>
            <CardGeneratorInner />
        </Suspense>
    );
}

function CardGeneratorInner() {
    const t = useTranslations('cardGenerator');
    const router = useRouter();
    const searchParams = useSearchParams();

    // Prefill from URL query (e.g. when launched via "Get card" from a memorial page).
    // If any prefill param is present, we start with no active template so fields are user-owned.
    const prefillFromUrl = (): { tplId: string | null; values: typeof emptyValues } => {
        const fromUrl = {
            name: searchParams.get('name') ?? '',
            birth: searchParams.get('birth') ?? '',
            death: searchParams.get('death') ?? '',
            place: searchParams.get('place') ?? '',
            quote: searchParams.get('quote') ?? '',
            photo: searchParams.get('photo') ?? '',
        };
        const hasAny = Object.values(fromUrl).some(Boolean);
        if (hasAny) return { tplId: null, values: fromUrl };
        return {
            tplId: defaultTpl.id,
            values: {
                name: defaultTpl.name,
                birth: defaultTpl.birth,
                death: defaultTpl.death,
                place: defaultTpl.place,
                quote: defaultTpl.quote,
                photo: defaultTpl.photo,
            },
        };
    };
    const initial = prefillFromUrl();

    const [format, setFormat] = useState<Format>('1:1');
    const [activeTplId, setActiveTplId] = useState<string | null>(initial.tplId);
    const [name, setName] = useState(initial.values.name);
    const [birth, setBirth] = useState(initial.values.birth);
    const [death, setDeath] = useState(initial.values.death);
    const [place, setPlace] = useState(initial.values.place);
    const [quote, setQuote] = useState(initial.values.quote);
    const [photo, setPhoto] = useState(initial.values.photo);
    const [downloading, setDownloading] = useState(false);
    const [upsellOpen, setUpsellOpen] = useState(false);

    const cardRef = useRef<HTMLDivElement>(null);
    const cardWrapRef = useRef<HTMLDivElement>(null);
    const [cardScale, setCardScale] = useState(1);

    const applyTemplate = (tpl: Template) => {
        setActiveTplId(tpl.id);
        setName(tpl.name);
        setBirth(tpl.birth);
        setDeath(tpl.death);
        setPlace(tpl.place);
        setQuote(tpl.quote);
        setPhoto(tpl.photo);
    };

    const clearTemplate = () => {
        setActiveTplId(null);
        setName(emptyValues.name);
        setBirth(emptyValues.birth);
        setDeath(emptyValues.death);
        setPlace(emptyValues.place);
        setQuote(emptyValues.quote);
        setPhoto(emptyValues.photo);
    };

    const toggleTemplate = (tpl: Template) => {
        if (activeTplId === tpl.id) clearTemplate();
        else applyTemplate(tpl);
    };

    const handlePhotoUpload = async (file: File): Promise<void> => {
        const dataUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = (ev) => resolve(ev.target?.result as string);
            reader.readAsDataURL(file);
        });
        setPhoto(dataUrl);
    };

    /**
     * Ersetzt jedes <img> im Card-Container durch eine inline data-URL,
     * damit html-to-image nichts mehr per fetch holen muss.
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
                console.warn('[CardGenerator] Could not inline image:', e);
            }
        }));
    };

    const renderToPng = async () => {
        if (!cardRef.current) throw new Error('No card ref');
        if (document.fonts && document.fonts.ready) await document.fonts.ready;
        await inlineImages();
        return await toPng(cardRef.current, {
            pixelRatio: 3,
            backgroundColor: '#e3e2e0',
        });
    };

    const handleDownload = async () => {
        if (!cardRef.current) return;
        setDownloading(true);
        try {
            const dataUrl = await renderToPng();
            const link = document.createElement('a');
            link.download = `memorial-${name.toLowerCase().replace(/\s+/g, '-')}-${format.replace(':', 'x')}.png`;
            link.href = dataUrl;
            link.click();
            toast.success(t('toastDownloaded'));
            setTimeout(() => setUpsellOpen(true), 600);
        } catch {
            toast.error(t('toastDownloadFailed'));
        } finally {
            setDownloading(false);
        }
    };

    const handleShare = async () => {
        if (!cardRef.current) return;
        setDownloading(true);
        try {
            const dataUrl = await renderToPng();
            const blob = await (await fetch(dataUrl)).blob();
            const file = new File(
                [blob],
                `memorial-${name.toLowerCase().replace(/\s+/g, '-')}.png`,
                { type: 'image/png' },
            );

            const shareText = t('shareText', { name, birth, death });

            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    title: `Memorial · ${name}`,
                    text: shareText,
                });
                toast.success(t('toastShared'));
            } else if (navigator.share) {
                await navigator.share({
                    title: `Memorial · ${name}`,
                    text: shareText,
                    url: 'https://memorialyard.com',
                });
                toast.success(t('toastLinkShared'));
            } else {
                await navigator.clipboard.writeText(shareText);
                const link = document.createElement('a');
                link.download = file.name;
                link.href = dataUrl;
                link.click();
                toast.success(t('toastDesktopFallback'));
            }
            setTimeout(() => setUpsellOpen(true), 600);
        } catch (err) {
            const e = err as { name?: string };
            if (e?.name !== 'AbortError') {
                toast.error(t('toastShareFailed'));
            }
        } finally {
            setDownloading(false);
        }
    };

    const dims = FORMAT_DIMS[format];

    // Auto-scale the card to fit the available wrapper width on mobile.
    // Card stays at its base render dimensions (so PNG quality is unchanged);
    // we only apply a CSS transform to fit the viewport.
    useEffect(() => {
        const el = cardWrapRef.current;
        if (!el) return;
        const update = () => {
            const w = el.clientWidth;
            setCardScale(Math.min(1, w / dims.w));
        };
        update();
        const ro = new ResizeObserver(update);
        ro.observe(el);
        return () => ro.disconnect();
    }, [dims.w]);

    return (
        <div className="min-h-screen" style={{ backgroundColor: 'hsl(var(--background))' }}>
            <Toaster position="top-center" />

            {/* Header */}
            <div className="border-b backdrop-blur-sm" style={{ borderColor: 'hsl(var(--border) / 0.4)', backgroundColor: 'hsl(var(--card) / 0.4)' }}>
                <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-6">
                    <Link
                        href="/"
                        className="flex items-center gap-2 text-sm font-light transition-colors"
                        style={{ color: 'hsl(var(--muted-foreground))' }}
                    >
                        <ArrowLeft className="h-4 w-4" />
                        <span className="hidden sm:inline">{t('back')}</span>
                    </Link>
                    <p className="text-[11px] font-light uppercase tracking-[0.3em]" style={{ color: 'hsl(var(--muted-foreground) / 0.6)' }}>
                        {t('headerLabel')}
                    </p>
                    <div className="w-4 sm:w-16" />
                </div>
            </div>

            <div className="mx-auto grid max-w-6xl gap-10 px-5 py-8 sm:px-6 sm:py-10 lg:grid-cols-[400px_1fr]">
                {/* Form */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="space-y-6"
                >
                    <div>
                        <h1 className="text-3xl font-light tracking-tight" style={{ color: 'hsl(var(--foreground))', fontFamily: 'Cormorant Garamond, serif' }}>
                            {t('title')}
                        </h1>
                        <p className="mt-2 text-sm font-light" style={{ color: 'hsl(var(--muted-foreground))' }}>
                            {t('subtitle')}
                        </p>
                    </div>

                    <div>
                        <label className={labelClass} style={labelStyle}>{t('templates')}</label>
                        <div className="mt-2 flex flex-wrap gap-2">
                            {templates.map((tpl) => {
                                const active = activeTplId === tpl.id;
                                return (
                                    <button
                                        key={tpl.id}
                                        type="button"
                                        onClick={() => toggleTemplate(tpl)}
                                        className="rounded-full px-3 py-1.5 text-xs font-light transition-colors"
                                        style={active ? {
                                            border: '1px solid hsl(var(--foreground))',
                                            backgroundColor: 'hsl(var(--foreground))',
                                            color: 'hsl(var(--background))',
                                        } : {
                                            border: '1px solid hsl(var(--border) / 0.6)',
                                            backgroundColor: 'hsl(var(--background))',
                                            color: 'hsl(var(--foreground))',
                                        }}
                                    >
                                        {tpl.name}
                                    </button>
                                );
                            })}
                        </div>
                        <p className="mt-1.5 text-[11px] font-light" style={{ color: 'hsl(var(--muted-foreground) / 0.7)' }}>
                            {t('templateHint')}
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className={labelClass} style={labelStyle}>{t('name')}</label>
                            <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} style={inputStyle} />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className={labelClass} style={labelStyle}>{t('birth')}</label>
                                <input value={birth} onChange={(e) => setBirth(e.target.value)} className={inputClass} style={inputStyle} />
                            </div>
                            <div>
                                <label className={labelClass} style={labelStyle}>{t('death')}</label>
                                <input value={death} onChange={(e) => setDeath(e.target.value)} className={inputClass} style={inputStyle} />
                            </div>
                        </div>

                        <div>
                            <label className={labelClass} style={labelStyle}>{t('place')}</label>
                            <input value={place} onChange={(e) => setPlace(e.target.value)} className={inputClass} style={inputStyle} />
                        </div>

                        <div>
                            <label className={labelClass} style={labelStyle}>{t('quote')}</label>
                            <textarea value={quote} onChange={(e) => setQuote(e.target.value)} className={`${inputClass} min-h-[80px] resize-none`} style={inputStyle} />
                        </div>

                        <div>
                            <label className={labelClass} style={labelStyle}>{t('photo')}</label>
                            <div className="mt-2">
                                <ImageUploader
                                    currentUrl={photo}
                                    onUpload={handlePhotoUpload}
                                />
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Preview */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="space-y-4"
                >
                    {/* Format toggle */}
                    <div
                        className="mx-auto flex w-fit items-center justify-center gap-1 rounded-full p-1"
                        style={{ border: '1px solid hsl(var(--border) / 0.4)', backgroundColor: 'hsl(var(--muted) / 0.3)' }}
                    >
                        <button
                            type="button"
                            onClick={() => setFormat('1:1')}
                            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-light transition-all"
                            style={format === '1:1' ? {
                                backgroundColor: 'hsl(var(--foreground))',
                                color: 'hsl(var(--background))',
                            } : {
                                color: 'hsl(var(--muted-foreground))',
                                backgroundColor: 'transparent',
                            }}
                        >
                            <Square className="h-3 w-3" /> {t('format11')}
                        </button>
                        <button
                            type="button"
                            onClick={() => setFormat('4:5')}
                            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-light transition-all"
                            style={format === '4:5' ? {
                                backgroundColor: 'hsl(var(--foreground))',
                                color: 'hsl(var(--background))',
                            } : {
                                color: 'hsl(var(--muted-foreground))',
                                backgroundColor: 'transparent',
                            }}
                        >
                            <RectangleVertical className="h-3 w-3" /> {t('format45')}
                        </button>
                        <button
                            type="button"
                            onClick={() => setFormat('9:16')}
                            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-light transition-all"
                            style={format === '9:16' ? {
                                backgroundColor: 'hsl(var(--foreground))',
                                color: 'hsl(var(--background))',
                            } : {
                                color: 'hsl(var(--muted-foreground))',
                                backgroundColor: 'transparent',
                            }}
                        >
                            <Smartphone className="h-3 w-3" /> {t('format916')}
                        </button>
                    </div>

                    {/* Card */}
                    <div className="flex w-full justify-center">
                        <div
                            ref={cardWrapRef}
                            className="relative w-full"
                            style={{
                                maxWidth: dims.w,
                                height: dims.h * cardScale,
                            }}
                        >
                        <div
                            ref={cardRef}
                            className="absolute left-0 top-0 origin-top-left overflow-hidden rounded-[28px] shadow-2xl"
                            style={{
                                width: dims.w,
                                height: dims.h,
                                transform: `scale(${cardScale})`,
                                background: `linear-gradient(180deg, hsl(230 35% 88% / 0.85) 0%, hsl(225 20% 90% / 0.95) 40%, hsl(35 15% 89%) 100%)`,
                                fontFamily: "'Cormorant Garamond', serif",
                            }}
                        >
                            <div className="flex h-full flex-col items-center px-7 py-5 text-center">
                                <p
                                    className={`${dims.brandSize} uppercase tracking-[0.4em] text-slate-600/80`}
                                    style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 500, letterSpacing: '0.4em' }}
                                >
                                    MemorialYard
                                </p>

                                {/* Photo */}
                                <div
                                    className={`${dims.photoMt} shrink-0 overflow-hidden rounded-full border-4 border-white/80`}
                                    style={{
                                        width: dims.photo,
                                        height: dims.photo,
                                    }}
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

                                {/* Name */}
                                <h2
                                    className={`${dims.nameMt} ${dims.nameSize} leading-tight text-slate-900`}
                                    style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 500, letterSpacing: '-0.01em' }}
                                >
                                    {name}
                                </h2>

                                {/* Dates */}
                                <p
                                    className={`mt-1.5 ${dims.dateSize} tracking-wide text-slate-700`}
                                    style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400 }}
                                >
                                    {birth} – {death}
                                </p>
                                <p
                                    className={`mt-0.5 ${dims.placeSize} text-slate-600`}
                                    style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400 }}
                                >
                                    ✦ {place}
                                </p>

                                <div className={`${dims.dividerMy} h-px w-12 bg-slate-400/40`} />

                                <p
                                    className={`${dims.labelSize} uppercase tracking-[0.3em] text-slate-600/80`}
                                    style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 500 }}
                                >
                                    {t('inLovingMemory')}
                                </p>

                                {/* Quote */}
                                <p
                                    className={`mt-3 px-2 ${dims.quoteSize} italic leading-snug text-slate-800`}
                                    style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400 }}
                                >
                                    „{quote}"
                                </p>

                                {/* Candle – glowing, like Memorial page (html-to-image-safe rendering) */}
                                <div
                                    className="flex flex-col items-center gap-0.5"
                                    style={{ marginTop: dims.candleMt }}
                                >
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
                                    <p
                                        className="text-[10px] text-slate-600"
                                        style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400 }}
                                    >
                                        {t('inMemoriam')}
                                    </p>
                                </div>

                                {/* Footer */}
                                <div className="mt-auto flex flex-col items-center pt-2">
                                    <p
                                        className={`${dims.footerSize} text-slate-600`}
                                        style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 500, letterSpacing: '0.05em' }}
                                    >
                                        memorialyard.com
                                    </p>
                                </div>
                            </div>
                        </div>
                        </div>
                    </div>

                    <div className="mx-auto flex w-full max-w-md flex-row gap-2">
                        <button
                            type="button"
                            onClick={handleShare}
                            disabled={downloading}
                            className="flex flex-1 items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-light transition-shadow disabled:opacity-40"
                            style={{
                                backgroundColor: 'hsl(var(--primary))',
                                color: 'hsl(var(--primary-foreground))',
                            }}
                        >
                            <Share2 className="h-4 w-4" />
                            {t('shareStory')}
                        </button>
                        <button
                            type="button"
                            onClick={handleDownload}
                            disabled={downloading}
                            className="flex flex-1 items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-light transition-colors disabled:opacity-40"
                            style={{
                                border: '1px solid hsl(var(--border) / 0.6)',
                                color: 'hsl(var(--foreground))',
                            }}
                        >
                            <Download className="h-4 w-4" />
                            {downloading ? t('creating') : t('png')}
                        </button>
                    </div>

                    <p className="mx-auto max-w-md text-center text-[11px] font-light leading-relaxed" style={{ color: 'hsl(var(--muted-foreground) / 0.7)' }}>
                        {t('tip')}
                    </p>
                </motion.div>
            </div>

            {/* Upsell after share / download */}
            <AnimatePresence>
                {upsellOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
                        style={{ backgroundColor: 'hsl(var(--foreground) / 0.5)' }}
                        onClick={() => setUpsellOpen(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, y: 20, scale: 0.96 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 20, scale: 0.96 }}
                            transition={{ duration: 0.25, ease: 'easeOut' }}
                            className="relative w-full max-w-md rounded-2xl p-6 shadow-2xl"
                            style={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border) / 0.4)' }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                type="button"
                                onClick={() => setUpsellOpen(false)}
                                className="absolute right-3 top-3 rounded-full p-1.5 transition-colors hover:bg-foreground/10"
                                style={{ color: 'hsl(var(--muted-foreground))' }}
                                aria-label="Close"
                            >
                                <X className="h-4 w-4" />
                            </button>

                            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full" style={{ backgroundColor: 'hsl(var(--primary) / 0.1)' }}>
                                <Sparkles className="h-5 w-5" style={{ color: 'hsl(var(--primary))' }} />
                            </div>

                            <h3
                                className="text-center text-2xl font-light tracking-tight"
                                style={{ fontFamily: 'Cormorant Garamond, serif', color: 'hsl(var(--foreground))' }}
                            >
                                {t('upsellTitle')}
                            </h3>
                            <p className="mt-2 text-center text-sm font-light leading-relaxed" style={{ color: 'hsl(var(--muted-foreground))' }}>
                                {t('upsellDescription')}
                            </p>

                            <Link
                                href={`/memorial/${t('upsellExampleSlug')}`}
                                onClick={() => setUpsellOpen(false)}
                                className="group mt-5 flex items-center justify-between rounded-xl px-4 py-3 transition-colors"
                                style={{
                                    border: '1px solid hsl(var(--border) / 0.6)',
                                    backgroundColor: 'hsl(var(--muted) / 0.2)',
                                }}
                            >
                                <div>
                                    <p className="text-[10px] font-normal uppercase tracking-[0.25em]" style={{ color: 'hsl(var(--muted-foreground))' }}>
                                        {t('upsellExampleLabel')}
                                    </p>
                                    <p className="mt-0.5 text-base" style={{ fontFamily: 'Cormorant Garamond, serif', color: 'hsl(var(--foreground))' }}>
                                        {t('upsellExampleSubtitle')}
                                    </p>
                                </div>
                                <ExternalLink className="h-4 w-4 transition-colors" style={{ color: 'hsl(var(--muted-foreground))' }} />
                            </Link>

                            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                                <button
                                    type="button"
                                    onClick={() => setUpsellOpen(false)}
                                    className="flex-1 rounded-full px-4 py-2.5 text-sm font-light transition-colors"
                                    style={{ color: 'hsl(var(--muted-foreground))' }}
                                >
                                    {t('upsellCancel')}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setUpsellOpen(false); router.push('/create'); }}
                                    className="flex-1 rounded-full px-4 py-2.5 text-sm font-light transition-shadow hover:shadow-md"
                                    style={{
                                        backgroundColor: 'hsl(var(--primary))',
                                        color: 'hsl(var(--primary-foreground))',
                                    }}
                                >
                                    {t('upsellCreate')}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
