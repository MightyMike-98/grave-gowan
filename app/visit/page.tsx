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
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function VisitPage() {
    const router = useRouter();

    const [memorialId, setMemorialId] = useState('');
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleEnter = async () => {
        const id = memorialId.trim();
        const e = email.trim().toLowerCase();

        if (!id || !e) {
            setError('Please enter both your email address and the Memorial ID.');
            return;
        }

        if (!e.includes('@')) {
            setError('Please enter a valid email address.');
            return;
        }

        setError('');
        setLoading(true);

        try {
            // Email + Memorial ID zusammen senden → sucht direkt in memorial_members
            const res = await fetch(
                `/api/memorials/find?email=${encodeURIComponent(e)}&memorialId=${encodeURIComponent(id)}`
            );
            const json = await res.json();

            if (res.ok && json.slug) {
                router.push(`/memorial/${json.slug}?visitor_email=${encodeURIComponent(e)}`);
                return;
            }

            setError(json.error ?? 'No memorial found. Please check both the Memorial ID and your email address.');
        } catch {
            setError('Network error. Please try again.');
        }

        setLoading(false);
    };

    return (
        <main className="min-h-screen bg-stone-100 flex flex-col items-center justify-center px-6">
            <div className="w-full max-w-sm">
                <Link
                    href="/"
                    className="block text-center text-stone-400 text-sm mb-8 hover:text-stone-600 transition-colors"
                >
                    ← Back
                </Link>

                <h1 className="text-3xl font-light text-stone-900 text-center mb-3">
                    Visit a Memorial
                </h1>
                <p className="text-center text-stone-400 text-sm mb-10">
                    Enter your email and the Memorial ID you received.
                </p>

                <div className="space-y-5">
                    {/* E-Mail */}
                    <div>
                        <label
                            htmlFor="visitor-email"
                            className="block text-stone-700 font-medium mb-2 text-sm uppercase tracking-wide"
                        >
                            Your Email
                        </label>
                        <input
                            id="visitor-email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleEnter()}
                            placeholder="name@example.com"
                            className="w-full bg-white border border-stone-200 rounded-lg px-4 py-4 text-lg text-stone-800 placeholder-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-400 transition"
                        />
                    </div>

                    {/* Memorial-ID */}
                    <div>
                        <label
                            htmlFor="memorial-id"
                            className="block text-stone-700 font-medium mb-2 text-sm uppercase tracking-wide"
                        >
                            Memorial ID
                        </label>
                        <input
                            id="memorial-id"
                            type="text"
                            value={memorialId}
                            onChange={(e) => setMemorialId(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleEnter()}
                            placeholder="e.g., 7c302e48-4a5b-4a1a-..."
                            autoCapitalize="none"
                            autoCorrect="off"
                            className="w-full bg-white border border-stone-200 rounded-lg px-4 py-4 text-lg text-stone-800 placeholder-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-400 transition font-mono text-base"
                        />
                        <p className="mt-2 text-xs text-stone-400">
                            Ask the memorial owner for the ID — it&apos;s shown under Team Access in the edit page.
                        </p>
                    </div>

                    {/* Fehleranzeige */}
                    {error && (
                        <p role="alert" className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
                            {error}
                        </p>
                    )}

                    {/* Enter-Button */}
                    <button
                        onClick={handleEnter}
                        disabled={loading}
                        className="w-full bg-stone-800 text-stone-100 font-semibold text-sm uppercase tracking-widest py-4 rounded-full shadow-lg hover:bg-stone-900 disabled:opacity-50 transition-colors flex items-center justify-center"
                    >
                        {loading ? (
                            <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                        ) : (
                            'Open Memorial'
                        )}
                    </button>

                    {/* Demo-Link */}
                    <p className="text-center text-stone-400 text-xs">
                        No ID?{' '}
                        <button
                            type="button"
                            onClick={() => router.push('/memorial/demo')}
                            className="underline hover:text-stone-600 transition-colors"
                        >
                            View demo memorial
                        </button>
                    </p>
                </div>
            </div>
        </main>
    );
}
