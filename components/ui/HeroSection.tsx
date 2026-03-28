'use client';

/**
 * @file components/ui/HeroSection.tsx
 * @description Der Hero-Bereich mit Framer Motion Lightbox.
 *
 * Lightbox nutzt AnimatePresence + motion.div scale 0.95→1
 * (exakt wie gentle-code-mover's Gallery Lightbox).
 * Kerzen-Widget nutzt motion für Puls-Animation.
 */

import { SaveButton } from '@/components/ui/SaveButton';
import type { MemorialView } from '@/types';
import { AnimatePresence, motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

/**
 * Kerzen-Widget — interaktives Element zum "Kerze anzünden".
 */
function CandleWidget({ memorialId, initialCount }: { memorialId: string; initialCount: number }) {
    const t = useTranslations('hero');
    const [count, setCount] = useState(initialCount);
    const [lit, setLit] = useState(false);

    const lightCandle = async () => {
        if (lit) return;
        setCount((c) => c + 1);
        setLit(true);
        const { createSupabaseBrowserClient } = await import('@data/browser-client');
        const supabase = createSupabaseBrowserClient();
        await supabase.rpc('increment_candle', { p_memorial_id: memorialId });
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="flex flex-col items-center gap-2 py-4"
        >
            <button
                onClick={lightCandle}
                disabled={lit}
                className="group relative flex h-16 w-16 items-center justify-center rounded-full transition-all duration-500"
                style={{
                    backgroundColor: lit ? 'rgba(251,191,36,0.12)' : 'hsl(var(--foreground) / 0.05)',
                    boxShadow: lit ? '0 0 30px 8px rgba(251,191,36,0.25)' : 'none',
                }}
            >
                <span
                    className="text-2xl transition-all duration-500"
                    style={{
                        filter: lit ? 'drop-shadow(0 0 8px rgba(251,191,36,0.6))' : 'none',
                    }}
                >
                    {lit ? '🔥' : '🕯️'}
                </span>
                {lit && (
                    <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: [1, 1.3, 1], opacity: [0, 1, 0.7] }}
                        transition={{ duration: 1.5, repeat: Infinity, repeatType: 'reverse' }}
                        className="absolute inset-0 rounded-full"
                        style={{ backgroundColor: 'rgba(251,191,36,0.1)' }}
                    />
                )}
            </button>
            <p className="text-xs font-light" style={{ color: 'hsl(var(--muted-foreground))' }}>
                {lit ? t('candleLit') : t('lightCandle')}
            </p>
            <p className="text-[11px] font-light" style={{ color: 'hsl(var(--muted-foreground) / 0.6)' }}>
                {count === 1 ? t('candlesOne') : t('candlesMany', { count })}
            </p>
        </motion.div>
    );
}

/**
 * Rendert den oberen Hero-Bereich einer Gedenkseite.
 */
export function HeroSection({ memorial, flowers = [], isAuthenticated = false, candleCount = 0, initialSaved = false, canEdit = false, memorialSlug = '' }: {
    memorial: MemorialView;
    flowers?: string[];
    isAuthenticated?: boolean;
    candleCount?: number;
    initialSaved?: boolean;
    canEdit?: boolean;
    memorialSlug?: string;
}) {
    const t = useTranslations('hero');
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);

    return (
        <div className="relative overflow-hidden pb-10 pt-4">
            {/* Background: blurred portrait or fallback */}
            <div className="absolute inset-0">
                {memorial.portraitUrl ? (
                    <Image
                        src={memorial.portraitUrl}
                        alt=""
                        fill
                        className="object-cover object-top opacity-15 blur-sm grayscale"
                        sizes="100vw"
                        priority
                    />
                ) : (
                    <div className="h-full w-full" style={{ backgroundColor: 'hsl(var(--muted))' }} />
                )}
                <div
                    className="absolute inset-0"
                    style={{
                        background: `linear-gradient(180deg, hsl(var(--memorial-top) / 0.85) 0%, hsl(var(--memorial-mid) / 0.9) 40%, hsl(var(--memorial-bottom)) 100%)`,
                    }}
                />
            </div>

            {/* Back button + Save button */}
            <div className="relative px-6 flex items-center justify-between">
                <Link
                    href={isAuthenticated ? '/dashboard' : '/'}
                    className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-light backdrop-blur-sm transition-colors"
                    style={{
                        backgroundColor: 'hsl(var(--foreground) / 0.05)',
                        color: 'hsl(var(--foreground) / 0.6)',
                    }}
                >
                    ← <span className="hidden sm:inline">{isAuthenticated ? t('backToDashboard') : t('backToHome')}</span>
                </Link>
                {!canEdit && <SaveButton memorialId={memorial.id} memorialSlug={memorialSlug} isAuthenticated={isAuthenticated} initialSaved={initialSaved} />}
            </div>

            {/* Main content */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="relative mt-20 flex flex-col items-center text-center"
            >
                {/* Avatar with ring */}
                {memorial.portraitUrl ? (
                    <button
                        onClick={() => setIsLightboxOpen(true)}
                        className="rounded-full p-1 shadow-lg backdrop-blur-sm cursor-pointer transition-transform duration-300 hover:scale-[1.03]"
                        style={{
                            backgroundColor: 'hsl(var(--card) / 0.5)',
                            boxShadow: '0 0 0 1px hsl(var(--foreground) / 0.05), 0 10px 15px -3px rgb(0 0 0 / 0.1)',
                        }}
                        title="Click to enlarge"
                    >
                        <div className="relative w-32 h-32 rounded-full overflow-hidden" style={{ border: '2px solid hsl(var(--card))' }}>
                            <Image
                                src={memorial.portraitUrl}
                                alt={`Portrait of ${memorial.name}`}
                                fill
                                className="object-cover"
                                sizes="128px"
                            />
                        </div>
                    </button>
                ) : (
                    <div
                        className="w-32 h-32 rounded-full shadow-lg flex items-center justify-center"
                        style={{
                            backgroundColor: 'hsl(var(--muted))',
                            border: '2px solid hsl(var(--card))',
                        }}
                    >
                        <span className="text-4xl font-light" style={{ color: 'hsl(var(--muted-foreground))' }}>
                            {(memorial.name || '?').charAt(0)}
                        </span>
                    </div>
                )}

                {/* Name */}
                <h1 className="mt-5 text-4xl tracking-tight md:text-5xl">
                    {memorial.name}
                </h1>

                {/* Dates */}
                <p className="mt-2 text-lg font-light" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    {memorial.dates}
                </p>

                {/* "In Loving Memory" */}
                <p className="mt-1 text-[11px] font-light uppercase tracking-[0.35em]" style={{ color: 'hsl(var(--muted-foreground) / 0.7)' }}>
                    {t('inLovingMemory')}
                </p>

                {/* Quote */}
                {memorial.quote && (
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4, duration: 0.8 }}
                        className="mt-6 max-w-md text-lg italic"
                        style={{
                            fontFamily: 'var(--font-serif)',
                            color: 'hsl(var(--foreground) / 0.5)',
                        }}
                    >
                        „{memorial.quote}"
                    </motion.p>
                )}

                {/* Candle Widget */}
                <CandleWidget memorialId={memorial.id} initialCount={candleCount} />

                {/* Flower row (legacy support) */}
                {flowers.length > 0 && (
                    <div className="mt-2 flex items-center gap-1.5 flex-wrap justify-center opacity-90">
                        {flowers.slice(-7).map((flower, i) => (
                            <span key={i} className="text-xl">{flower}</span>
                        ))}
                        {flowers.length > 7 && (
                            <span className="text-sm ml-1 self-center" style={{ color: 'hsl(var(--muted-foreground))' }}>
                                +{flowers.length - 7}
                            </span>
                        )}
                    </div>
                )}
            </motion.div>

            {/* Lightbox — AnimatePresence + soft scale (exactly like gentle-code-mover) */}
            <AnimatePresence>
                {isLightboxOpen && memorial.portraitUrl && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm cursor-zoom-out"
                        style={{ backgroundColor: 'hsl(var(--foreground) / 0.9)' }}
                        onClick={() => setIsLightboxOpen(false)}
                    >
                        <button
                            className="absolute top-6 right-6 rounded-full p-2 transition-colors"
                            style={{ color: 'hsl(var(--primary-foreground) / 0.7)' }}
                            onClick={() => setIsLightboxOpen(false)}
                        >
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.3 }}
                            className="relative w-full max-w-2xl aspect-square sm:aspect-auto sm:h-[80vh] rounded-2xl overflow-hidden shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <Image
                                src={memorial.portraitUrl}
                                alt={`Enlarged portrait of ${memorial.name}`}
                                fill
                                className="object-contain"
                                sizes="(max-width: 768px) 100vw, 80vw"
                            />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
