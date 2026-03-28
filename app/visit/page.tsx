/**
 * @file app/visit/page.tsx
 * @description Die "Visit Memorial"-Zugangsseite für Besucher.
 *
 * Nutzer suchen nach öffentlichen Gedenkseiten oder geben den direkten Link ein.
 * Private Memorials sind nur über den direkten Link erreichbar.
 * Live-Suche mit Debounce beim Tippen.
 */

'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

interface SearchResult {
    slug: string;
    name: string;
    portraitUrl?: string;
}

export default function VisitPage() {
    const t = useTranslations('visit');
    const router = useRouter();

    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<SearchResult[]>([]);
    const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

    // Live-Suche mit 300ms Debounce
    useEffect(() => {
        const input = query.trim();

        if (!input || input.length < 2) {
            setResults([]);
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
            setLoading(false);
        }, 300);

        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    }, [query]);

    return (
        <main className="flex min-h-screen flex-col items-center justify-center px-4">
            <div className="w-full max-w-lg space-y-8 text-center animate-fade-up">

                <Link
                    href="/"
                    className="text-sm font-light transition-colors hover:opacity-100"
                    style={{ color: 'hsl(var(--muted-foreground))' }}
                >
                    {t('back')}
                </Link>

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

                {/* Search results grid */}
                {results.length > 0 && (
                    <div className="grid grid-cols-2 gap-3 text-left">
                        {results.map((r) => (
                            <button
                                key={r.slug}
                                type="button"
                                onClick={() => router.push(`/memorial/${r.slug}`)}
                                className="flex flex-col items-center justify-center gap-2 rounded-2xl px-4 py-6 shadow-sm transition-all duration-200 hover:shadow-md hover:scale-[1.02]"
                                style={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border) / 0.3)' }}
                            >
                                {r.portraitUrl ? (
                                    <img src={r.portraitUrl} alt={r.name} className="w-10 h-10 rounded-full object-cover" />
                                ) : (
                                    <span className="w-10 h-10 rounded-full flex items-center justify-center text-lg" style={{ backgroundColor: 'hsl(var(--muted) / 0.3)' }}>
                                        🕊
                                    </span>
                                )}
                                <span className="text-sm font-light text-center" style={{ color: 'hsl(var(--foreground))' }}>{r.name}</span>
                            </button>
                        ))}
                    </div>
                )}

                {/* No results hint (only when actively searching) */}
                {query.trim().length >= 2 && !loading && results.length === 0 && (
                    <p className="text-sm font-light" style={{ color: 'hsl(var(--muted-foreground) / 0.6)' }}>
                        {t('errorNotFound')}
                    </p>
                )}

                {/* Hint */}
                <p className="text-sm font-light" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    {t('privateHint')}
                </p>
            </div>
        </main>
    );
}
