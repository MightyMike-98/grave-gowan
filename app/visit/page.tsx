/**
 * @file app/visit/page.tsx
 * @description Die "Visit Memorial"-Zugangsseite für Besucher.
 *
 * Nutzer müssen ihre E-Mail-Adresse UND die Memorial-ID eingeben.
 * Beide Felder sind Pflicht — so wird sichergestellt, dass nur eingeladene
 * Personen das Memorial finden können.
 *
 * Ablauf:
 * 1. Memorial per ID/Slug suchen via /api/memorials/find
 * 2. Prüfen ob die eingegebene E-Mail als Member eingeladen ist
 */

'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function VisitPage() {
    const t = useTranslations('visit');
    const router = useRouter();

    const [memorialId, setMemorialId] = useState('');
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleEnter = async () => {
        const id = memorialId.trim();
        const e = email.trim().toLowerCase();

        if (!id || !e) {
            setError(t('errorBothRequired'));
            return;
        }

        if (!e.includes('@')) {
            setError(t('errorInvalidEmail'));
            return;
        }

        setError('');
        setLoading(true);

        try {
            const res = await fetch(
                `/api/memorials/find?email=${encodeURIComponent(e)}&memorialId=${encodeURIComponent(id)}`
            );
            const json = await res.json();

            if (res.ok && json.slug) {
                router.push(`/memorial/${json.slug}?visitor_email=${encodeURIComponent(e)}`);
                return;
            }

            setError(json.error ?? t('errorNotFound'));
        } catch {
            setError(t('errorNetwork'));
        }

        setLoading(false);
    };

    return (
        <main className="flex min-h-screen flex-col items-center justify-center px-4">
            <div className="w-full max-w-md space-y-6 text-center animate-fade-up">

                <h1 className="text-4xl tracking-tight">
                    {t('heading')}
                </h1>
                <p className="font-light" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    {t('description')}
                </p>

                <div className="space-y-5 text-left">
                    {/* E-Mail */}
                    <div className="space-y-2">
                        <label
                            htmlFor="visitor-email"
                            className="block text-[11px] font-medium uppercase tracking-[0.15em]"
                            style={{ color: 'hsl(var(--muted-foreground))' }}
                        >
                            {t('emailLabel')}
                        </label>
                        <input
                            id="visitor-email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleEnter()}
                            placeholder={t('emailPlaceholder')}
                            className="field-input"
                        />
                    </div>

                    {/* Memorial-ID */}
                    <div className="space-y-2">
                        <label
                            htmlFor="memorial-id"
                            className="block text-[11px] font-medium uppercase tracking-[0.15em]"
                            style={{ color: 'hsl(var(--muted-foreground))' }}
                        >
                            {t('idLabel')}
                        </label>
                        <input
                            id="memorial-id"
                            type="text"
                            value={memorialId}
                            onChange={(e) => setMemorialId(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleEnter()}
                            placeholder={t('idPlaceholder')}
                            autoCapitalize="none"
                            autoCorrect="off"
                            className="field-input font-mono"
                        />
                        <p className="text-xs font-light" style={{ color: 'hsl(var(--muted-foreground))' }}>
                            {t('idHelper')}
                        </p>
                    </div>

                    {/* Fehleranzeige */}
                    {error && (
                        <p role="alert" className="text-sm rounded-lg px-4 py-3"
                            style={{
                                color: 'hsl(var(--destructive))',
                                backgroundColor: 'hsl(var(--destructive) / 0.05)',
                                border: '1px solid hsl(var(--destructive) / 0.2)',
                            }}
                        >
                            {error}
                        </p>
                    )}

                    {/* Enter-Button */}
                    <button
                        onClick={handleEnter}
                        disabled={loading}
                        className="w-full rounded-full py-4 text-xs font-normal uppercase tracking-[0.25em] shadow-sm transition-shadow duration-300 hover:shadow-md disabled:opacity-50 flex items-center justify-center"
                        style={{
                            backgroundColor: 'hsl(var(--primary))',
                            color: 'hsl(var(--primary-foreground))',
                        }}
                    >
                        {loading ? (
                            <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                        ) : (
                            t('openMemorial')
                        )}
                    </button>

                    {/* Demo-Link */}
                    <p className="text-center text-sm font-light" style={{ color: 'hsl(var(--muted-foreground))' }}>
                        {t('noId')}{' '}
                        <button
                            type="button"
                            onClick={() => router.push('/memorial/demo')}
                            className="underline underline-offset-4 transition-colors hover:opacity-100"
                            style={{ color: 'hsl(var(--foreground) / 0.7)' }}
                        >
                            {t('viewDemo')}
                        </button>
                    </p>
                                                <div className="w-full max-w-md space-y-6 text-center animate-fade-up">

                                    <Link
                    href="/"
                    className="text-sm font-light transition-colors hover:opacity-100"
                    style={{ color: 'hsl(var(--muted-foreground))' }}
                >
                    {t('back')}
                </Link>
                </div>
                </div>
            </div>
        </main>
    );
}
