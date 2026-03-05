'use client';

/**
 * @file components/ui/HeroSection.tsx
 * @description Der Hero-Bereich oben auf jeder Gedenkseite.
 *
 * Zeigt das Titelbild (Cover), das runde Porträtfoto (mit Lightbox-Vergrößerung),
 * den Namen, die Lebensdaten und einen Zurück-Button.
 */

import type { Memorial } from '@/types';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

/** Props der HeroSection-Komponente. */
interface HeroSectionProps {
    /** Das vollständige Memorial-Objekt mit Name, Dates, Bild-URLs etc. */
    memorial: Memorial;
    /** Liste der bisher platzierten virtuellen Blumen-Emojis (z. B. ["🌹", "🌸"]). */
    flowers?: string[];
    /** E-Mail des Gastbesuchers (wenn vorhanden → Back führt zur Startseite statt Dashboard). */
    visitorEmail?: string;
}

/**
 * Rendert den oberen Hero-Bereich einer Gedenkseite.
 * Zeigt Cover-Bild, Gradient-Overlay, Porträt, Name, Daten und Blumenreihe.
 */
export function HeroSection({ memorial, flowers = [], visitorEmail }: HeroSectionProps) {
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);

    return (
        <div className="relative w-full h-[55vh] min-h-[400px] bg-stone-200 overflow-hidden">
            {/* Schwebender Zurück-Button */}
            <Link
                href={visitorEmail ? '/' : '/dashboard'}
                className="absolute top-6 left-6 z-20 bg-black/20 hover:bg-black/40 backdrop-blur-md text-white px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 transition-all"
            >
                ← <span className="hidden sm:inline">{visitorEmail ? 'Back to Home' : 'Back to Dashboard'}</span>
            </Link>

            {/* Titelbild oder Platzhalter-Hintergrund */}
            {memorial.coverUrl ? (
                <Image
                    src={memorial.coverUrl}
                    alt=""
                    fill
                    priority
                    className="object-cover"
                    sizes="100vw"
                />
            ) : (
                <div className="absolute inset-0 bg-stone-300 flex items-center justify-center">
                    <span className="text-6xl opacity-10">🕊️</span>
                </div>
            )}

            {/* Weicher Farbverlauf von transparent zu stone-100 am unteren Rand */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-stone-100" />

            {/* Zentrierter Inhaltsbereich: Porträt, Name, Dates, Blumen */}
            <div className="absolute bottom-10 left-0 right-0 flex flex-col items-center px-6">
                {/* Rundes Porträtfoto (Klickbar für Lightbox) oder Initialen-Platzhalter */}
                {memorial.portraitUrl ? (
                    <button
                        onClick={() => setIsLightboxOpen(true)}
                        className="relative w-36 h-36 rounded-full border-4 border-stone-100 shadow-xl overflow-hidden hover:scale-105 transition-transform cursor-pointer group"
                        title="Click to enlarge"
                    >
                        <Image
                            src={memorial.portraitUrl}
                            alt={`Portrait of ${memorial.name}`}
                            fill
                            className="object-cover"
                            sizes="144px"
                        />
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="text-white text-2xl">🔍</span>
                        </div>
                    </button>
                ) : (
                    <div className="w-36 h-36 rounded-full border-4 border-stone-100 bg-stone-200 shadow-xl flex items-center justify-center">
                        <span className="text-5xl text-stone-400 font-light">
                            {(memorial.name || '?').charAt(0)}
                        </span>
                    </div>
                )}

                {/* Name, Lebensdaten und Subtext */}
                <h1 className="mt-5 text-3xl font-medium text-stone-800 text-center tracking-tight">
                    {memorial.name}
                </h1>
                <p className="mt-2 text-lg font-light text-stone-600 tracking-widest text-center">
                    {memorial.dates}
                </p>
                <p className="mt-1.5 text-xs text-stone-500 uppercase tracking-[0.2em] opacity-80">
                    In Loving Memory
                </p>

                {/* Blumenreihe */}
                {flowers.length > 0 && (
                    <div className="mt-6 flex items-center gap-1.5 flex-wrap justify-center opacity-90">
                        {flowers.slice(-7).map((flower, i) => (
                            <span key={i} className="text-xl">{flower}</span>
                        ))}
                        {flowers.length > 7 && (
                            <span className="text-sm text-stone-500 ml-1 self-center">
                                +{flowers.length - 7}
                            </span>
                        )}
                    </div>
                )}
            </div>

            {/* Lightbox / Fullscreen Image Modal */}
            {isLightboxOpen && memorial.portraitUrl && (
                <div
                    className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm cursor-zoom-out animate-in fade-in duration-200"
                    onClick={() => setIsLightboxOpen(false)}
                >
                    <button
                        className="absolute top-6 right-6 text-white/70 hover:text-white text-4xl font-light transition-colors"
                        onClick={() => setIsLightboxOpen(false)}
                    >
                        ×
                    </button>
                    <div className="relative w-full max-w-2xl aspect-square sm:aspect-auto sm:h-[80vh] rounded-2xl overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        <Image
                            src={memorial.portraitUrl}
                            alt={`Enlarged portrait of ${memorial.name}`}
                            fill
                            className="object-contain"
                            sizes="(max-width: 768px) 100vw, 80vw"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
