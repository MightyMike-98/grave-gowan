/**
 * @file app/login/page.tsx
 * @description Die dedizierte Login-Seite der App.
 *
 * Bietet zwei echte Auth-Methoden via Supabase:
 * 1. **Google OAuth**: Klick → Weiterleitung zu Google → zurück → Dashboard
 * 2. **Magic Link (Email)**: Nutzer gibt Email ein → bekommt einen Login-Link zugeschickt
 *
 * URL-Parameter:
 * - `?next=/create` → nach Login auf diese URL weiterleiten
 * - `?error=...`    → Fehlermeldung aus dem OAuth-Callback anzeigen
 *
 * Benötigt 'use client' für useState (Email-Input, Loading, Feedback-Nachrichten).
 * Auth-Logik kommt aus data/src/auth.ts — keine direkten Supabase-Imports hier.
 */

'use client';

import { signInWithGoogle, signInWithMagicLink } from '@data/auth';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';

/** Die eigentliche Login-Form, wrapped in Suspense für useSearchParams. */
function LoginForm() {
    const searchParams = useSearchParams();

    /** Ziel-URL nach erfolgreichem Login (aus dem Middleware-Redirect). */
    const next = searchParams.get('next') ?? '/dashboard';

    /** Fehler aus dem OAuth-Callback (z. B. "Authentication failed"). */
    const callbackError = searchParams.get('error');

    /** E-Mail-Eingabe für den Magic Link. */
    const [email, setEmail] = useState('');

    /** Gibt an ob gerade ein Request läuft (Google oder Magic Link). */
    const [loading, setLoading] = useState<'google' | 'email' | null>(null);

    /** Fehlermeldung aus Auth-Funktionen. */
    const [error, setError] = useState<string | null>(callbackError);

    /** Bestätigungsmeldung nach erfolgreichem Magic-Link-Versand. */
    const [magicLinkSent, setMagicLinkSent] = useState(false);

    /**
     * Startet den Google OAuth-Flow.
     * Browser wird zu Google weitergeleitet, kommt zurück via /auth/callback.
     */
    const handleGoogle = async () => {
        setLoading('google');
        setError(null);
        const { error } = await signInWithGoogle();
        if (error) {
            setError(error);
            setLoading(null);
        }
        // Bei Erfolg: Browser navigiert automatisch zu Google (kein setLoading(null) nötig)
    };

    /**
     * Sendet einen Magic Link an die eingegebene E-Mail-Adresse.
     * Zeigt eine Bestätigungsnachricht nach erfolgreichem Versand.
     */
    const handleMagicLink = async () => {
        if (!email.trim()) {
            setError('Please enter your email address.');
            return;
        }
        setLoading('email');
        setError(null);
        const { error } = await signInWithMagicLink(email);
        setLoading(null);
        if (error) {
            setError(error);
        } else {
            setMagicLinkSent(true);
        }
    };

    // Bestätigungsansicht nach Magic Link Versand
    if (magicLinkSent) {
        return (
            <main className="min-h-screen bg-stone-100 flex flex-col items-center justify-center px-6">
                <div className="w-full max-w-sm text-center space-y-6">
                    <div className="text-5xl">📬</div>
                    <h1 className="text-2xl font-semibold text-stone-800">Check your email</h1>
                    <p className="text-stone-500 leading-relaxed">
                        We&apos;ve sent a login link to <strong className="text-stone-700">{email}</strong>.
                        Click the link in the email to sign in.
                    </p>
                    <button
                        onClick={() => { setMagicLinkSent(false); setEmail(''); }}
                        className="text-stone-400 text-sm hover:text-stone-600 transition-colors"
                    >
                        Use a different email
                    </button>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-stone-100 flex flex-col items-center justify-center px-6">
            <div className="w-full max-w-sm space-y-8">
                {/* Header */}
                <div className="text-center">
                    <h1 className="text-4xl font-light text-stone-900 mb-2">Cloudyard</h1>
                    <p className="text-stone-500 text-sm">Sign in to manage your memorials</p>
                </div>

                <div className="space-y-4">
                    {/* Google OAuth Button */}
                    <button
                        onClick={handleGoogle}
                        disabled={!!loading}
                        id="btn-google-login"
                        className="w-full bg-white border border-stone-200 text-stone-700 font-medium py-4 rounded-xl flex items-center justify-center gap-3 hover:bg-stone-50 disabled:opacity-50 transition-colors shadow-sm text-base"
                    >
                        {loading === 'google' ? (
                            <span className="animate-spin w-5 h-5 border-2 border-stone-400 border-t-transparent rounded-full" />
                        ) : (
                            /* Google Logo SVG */
                            <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
                                <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.1 29.3 35 24 35c-6.1 0-11-4.9-11-11s4.9-11 11-11c2.8 0 5.3 1 7.2 2.7l5.7-5.7C33.5 7.1 29 5 24 5 12.9 5 4 13.9 4 25s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.6-.4-3.9z" />
                                <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.1 18.9 12 24 12c2.8 0 5.3 1 7.2 2.7l5.7-5.7C33.5 7.1 29 5 24 5c-7.7 0-14.3 4.4-17.7 9.7z" />
                                <path fill="#4CAF50" d="M24 45c4.9 0 9.4-1.9 12.8-4.9l-5.9-5c-1.8 1.3-4 2.1-6.9 2.1-5.2 0-9.6-3-11.3-7.2l-6.6 5.1C9.7 40.6 16.4 45 24 45z" />
                                <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.3 4.1-4.2 5.4l5.9 5c-.4.4 6.6-4.8 6.6-13.4 0-1.3-.1-2.6-.4-3.9z" />
                            </svg>
                        )}
                        Continue with Google
                    </button>

                    {/* Divider */}
                    <div className="flex items-center gap-3">
                        <div className="flex-1 h-px bg-stone-200" />
                        <span className="text-stone-400 text-sm">or</span>
                        <div className="flex-1 h-px bg-stone-200" />
                    </div>

                    {/* Magic Link Email */}
                    <div className="space-y-3">
                        <input
                            id="input-email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleMagicLink()}
                            placeholder="your@email.com"
                            className="w-full bg-white border border-stone-200 rounded-xl px-4 py-4 text-stone-800 placeholder-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-400 transition text-base"
                        />
                        <button
                            onClick={handleMagicLink}
                            disabled={!!loading}
                            id="btn-email-login"
                            className="w-full bg-stone-800 text-white font-semibold py-4 rounded-xl hover:bg-stone-900 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 text-base"
                        >
                            {loading === 'email' ? (
                                <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                            ) : (
                                <>
                                    <span>✉️</span>
                                    <span>Send Magic Link</span>
                                </>
                            )}
                        </button>
                    </div>

                    {/* Fehlermeldung */}
                    {error && (
                        <p role="alert" className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3 text-center">
                            {error}
                        </p>
                    )}
                </div>

                {/* Zurück-Link */}
                <Link
                    href="/"
                    className="block text-center text-stone-400 text-sm hover:text-stone-600 transition-colors"
                >
                    ← Back to Home
                </Link>

                {/* Hidden next-param für den Callback */}
                <input type="hidden" name="next" value={next} />
            </div>
        </main>
    );
}

/** Seiten-Einstiegspunkt mit Suspense-Wrapper (erforderlich für useSearchParams). */
export default function LoginPage() {
    return (
        <Suspense fallback={
            <main className="min-h-screen bg-stone-100 flex items-center justify-center">
                <span className="animate-spin w-8 h-8 border-2 border-stone-400 border-t-transparent rounded-full" />
            </main>
        }>
            <LoginForm />
        </Suspense>
    );
}
