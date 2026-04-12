/**
 * @file app/visit/page.tsx
 * @description Die "Visit Memorial"-Zugangsseite für Besucher.
 *
 * Nutzer suchen nach öffentlichen Gedenkseiten oder geben den direkten Link ein.
 * Private Memorials sind nur über den direkten Link erreichbar.
 * Live-Suche mit Debounce beim Tippen.
 */

'use client';

import { AnimatePresence, motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

interface SearchResult {
    slug: string;
    name: string;
    portraitUrl?: string;
    dateOfBirth?: string;
    dateOfDeath?: string;
    country?: string;
}


function formatDates(birth?: string, death?: string): string | null {
    const b = birth ? new Date(birth).getFullYear() : null;
    const d = death ? new Date(death).getFullYear() : null;
    if (b && d) return `${b} – ${d}`;
    if (b) return `* ${b}`;
    if (d) return `† ${d}`;
    return null;
}

export default function VisitPage() {
    const t = useTranslations('visit');
    const router = useRouter();

    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<SearchResult[]>([]);
    const [searched, setSearched] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

    // Live-Suche mit 300ms Debounce
    useEffect(() => {
        const input = query.trim();

        if (!input || input.length < 2) {
            setResults([]);
            setSearched(false);
            return;
        }

        if (debounceRef.current) clearTimeout(debounceRef.current);

        debounceRef.current = setTimeout(async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/memorials/find?q=${encodeURIComponent(input)}`);
                const json = await res.json();

                if (res.ok && json.results) {
                    setResults(json.results);
                } else {
                    setResults([]);
                }
            } catch {
                setResults([]);
            }
            setSearched(true);
            setLoading(false);
        }, 300);

        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    }, [query]);

    return (
        <main className="relative flex min-h-screen flex-col items-center justify-center px-4">
            {/* Back button — top left */}
            <Link
                href="/"
                className="absolute left-6 top-6 inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-light backdrop-blur-sm transition-colors"
                style={{
                    backgroundColor: 'hsl(var(--foreground) / 0.05)',
                    color: 'hsl(var(--foreground) / 0.6)',
                }}
            >
                {t('back')}
            </Link>

            <div className="w-full max-w-lg space-y-8 text-center animate-fade-up">
                <h1 className="text-5xl tracking-tight">
                    {t('heading')}
                </h1>

                {/* Search input */}
                <div
                    className="flex items-center gap-3 rounded-2xl px-5 py-4 shadow-sm"
                    style={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border) / 0.3)' }}
                >
                    {loading ? (
                        <span className="shrink-0 h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" style={{ color: 'hsl(var(--muted-foreground) / 0.4)' }} />
                    ) : (
                        <svg className="shrink-0 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} style={{ color: 'hsl(var(--muted-foreground) / 0.4)' }}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                        </svg>
                    )}
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={t('searchPlaceholder')}
                        autoCapitalize="none"
                        autoCorrect="off"
                        autoFocus
                        className="w-full bg-transparent text-base font-light outline-none placeholder:font-light"
                        style={{ color: 'hsl(var(--foreground))' }}
                    />
                </div>

                {/* Search results — staggered fade-in list */}
                <AnimatePresence mode="wait">
                    {results.length > 0 && (
                        <motion.div
                            key="results"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0, y: -4 }}
                            transition={{ duration: 0.3 }}
                            className="space-y-2 text-left"
                        >
                            {results.map((r, i) => {
                                const dates = formatDates(r.dateOfBirth, r.dateOfDeath);
                                return (
                                    <motion.div
                                        key={r.slug}
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.07, duration: 0.35, ease: 'easeOut' }}
                                    >
                                        <button
                                            type="button"
                                            onClick={() => router.push(`/memorial/${r.slug}`)}
                                            className="group flex w-full items-center gap-4 rounded-2xl border px-5 py-4 shadow-sm transition-all duration-300 hover:shadow-md"
                                            style={{
                                                backgroundColor: 'hsl(var(--card))',
                                                borderColor: 'hsl(var(--border) / 0.4)',
                                            }}
                                            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'hsl(var(--border) / 0.8)'; }}
                                            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'hsl(var(--border) / 0.4)'; }}
                                        >
                                            {/* Portrait with hover zoom */}
                                            {r.portraitUrl ? (
                                                <div className="relative h-10 w-10 shrink-0 rounded-full overflow-hidden transition-transform duration-300 group-hover:scale-110" style={{ backgroundColor: 'hsl(var(--muted))' }}>
                                                    <Image src={r.portraitUrl} alt={r.name} fill className="object-cover" sizes="40px" />
                                                </div>
                                            ) : (
                                                <div
                                                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-transform duration-300 group-hover:scale-110"
                                                    style={{ backgroundColor: 'hsl(var(--muted))' }}
                                                >
                                                    <span className="text-base font-light" style={{ color: 'hsl(var(--muted-foreground))' }}>
                                                        {r.name.charAt(0)}
                                                    </span>
                                                </div>
                                            )}

                                            {/* Name + Dates */}
                                            <div className="flex-1 min-w-0 text-left">
                                                <p className="text-sm font-medium truncate" style={{ color: 'hsl(var(--foreground))' }}>
                                                    {r.name}
                                                </p>
                                                {dates && (
                                                    <p className="text-xs font-light" style={{ color: 'hsl(var(--muted-foreground))' }}>
                                                        {dates}
                                                    </p>
                                                )}
                                            </div>

                                            {/* Country */}
                                            {r.country && (
                                                <span className="text-[11px] font-light shrink-0" style={{ color: 'hsl(var(--muted-foreground) / 0.7)' }}>
                                                    {r.country}
                                                </span>
                                            )}
                                        </button>
                                    </motion.div>
                                );
                            })}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* No results hint */}
                <AnimatePresence>
                    {searched && !loading && results.length === 0 && query.trim().length >= 2 && (
                        <motion.p
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="text-sm font-light"
                            style={{ color: 'hsl(var(--muted-foreground) / 0.6)' }}
                        >
                            {t('errorNotFound')}
                        </motion.p>
                    )}
                </AnimatePresence>

                {/* Hint */}
                <p className="text-sm font-light" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    {t('privateHint')}
                </p>

                {/* Example Memorial */}
                <div className="pt-2">
                    <Link
                        href="/memorial/muhammad-ali-1942"
                        className="inline-flex items-center gap-1.5 text-[11px] font-light transition-colors"
                        style={{ color: 'hsl(var(--muted-foreground) / 0.5)' }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = 'hsl(var(--muted-foreground))')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = 'hsl(var(--muted-foreground) / 0.5)')}
                    >
                        <span>✦</span>
                        <span>{t('viewDemo')}</span>
                    </Link>
                </div>
            </div>
        </main>
    );
}
