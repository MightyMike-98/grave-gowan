/**
 * @file components/ui/SupportSection.tsx
 * @description Spenden-Bereich der Gedenkseite.
 *
 * Blume leuchtet auf wenn der Spendenlink geklickt wird.
 */

'use client';

import type { SupportSection as SupportSectionType } from '@/types';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

interface SupportSectionProps {
    support?: SupportSectionType;
    onDonate?: () => void;
    memorialId?: string;
    initialFlowerCount?: number;
}

export function SupportSection({ support, onDonate, memorialId, initialFlowerCount = 0 }: SupportSectionProps) {
    const t = useTranslations('support');
    const [flowerLaid, setFlowerLaid] = useState(false);
    const [flowerCount, setFlowerCount] = useState(initialFlowerCount);

    const handleDonateClick = async () => {
        if (!flowerLaid) {
            setFlowerCount((c) => c + 1);
            setFlowerLaid(true);
            onDonate?.();
            if (memorialId) {
                const { createSupabaseBrowserClient } = await import('@data/browser-client');
                const supabase = createSupabaseBrowserClient();
                await supabase.rpc('increment_flower', { p_memorial_id: memorialId });
            }
        }
    };

    if (!support || support.links.length === 0) return null;

    return (
        <section aria-label="Support & Legacy" className="py-12">
            <div className="mx-auto flex max-w-md flex-col items-center text-center">
                {/* Flower indicator — lights up when donate is clicked */}
                <div
                    className="relative flex h-20 w-20 items-center justify-center rounded-full transition-all duration-500"
                    style={{
                        backgroundColor: flowerLaid
                            ? 'rgba(244,63,94,0.08)'
                            : 'hsl(var(--foreground) / 0.05)',
                        boxShadow: flowerLaid
                            ? '0 0 30px 8px rgba(244,63,94,0.12)'
                            : 'none',
                    }}
                >
                    <span
                        className="text-3xl transition-transform duration-500"
                        style={{ transform: flowerLaid ? 'scale(1.1)' : 'scale(1)' }}
                    >
                        💐
                    </span>
                    {flowerLaid && (
                        <span
                            className="absolute inset-0 rounded-full animate-gentle-pulse"
                            style={{ backgroundColor: 'rgba(244,63,94,0.08)' }}
                        />
                    )}
                </div>

                <h2 className="mt-5 text-2xl tracking-tight">
                    {flowerLaid ? t('flowerLaid') : t('layFlower')}
                </h2>
                <p
                    className="mt-1.5 text-xs font-light"
                    style={{ color: 'hsl(var(--muted-foreground) / 0.6)' }}
                >
                    {flowerCount === 1 ? t('flowersOne') : t('flowersMany', { count: flowerCount })}
                </p>

                {/* Donate CTA — clicking also triggers flower */}
                <div className="mt-10 w-full space-y-3">
                    {support.links.map((link, i) => (
                        <a
                            key={i}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={handleDonateClick}
                            className="block w-full rounded-full py-5 text-xs font-normal uppercase tracking-[0.25em] shadow-sm transition-shadow duration-300 hover:shadow-md text-center"
                            style={{
                                backgroundColor: 'hsl(var(--primary))',
                                color: 'hsl(var(--primary-foreground))',
                            }}
                        >
                            Spenden – {link.title}
                        </a>
                    ))}
                    <p
                        className="mt-3 text-[11px] font-light"
                        style={{ color: 'hsl(var(--muted-foreground) / 0.5)' }}
                    >
                        {support.description}
                    </p>
                </div>
            </div>
        </section>
    );
}
