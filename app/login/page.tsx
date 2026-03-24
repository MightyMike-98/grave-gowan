/**
 * @file app/login/page.tsx
 * @description Die dedizierte Login-Seite der App.
 *
 * Bietet zwei Auth-Methoden via Supabase:
 * 1. **Google OAuth**: Klick → Weiterleitung zu Google → zurück → Dashboard
 * 2. **Email + Passwort**: Registrierung oder Login mit E-Mail und Passwort
 *
 * URL-Parameter:
 * - `?next=/create` → nach Login auf diese URL weiterleiten
 * - `?error=...`    → Fehlermeldung aus dem OAuth-Callback anzeigen
 */

'use client';

import { signInWithEmail, signInWithGoogle, signUpWithEmail } from '@data/auth';
import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';

/** Die eigentliche Login-Form, wrapped in Suspense für useSearchParams. */
function LoginForm() {
    const searchParams = useSearchParams();

    /** Ziel-URL nach erfolgreichem Login. */
    const next = searchParams.get('next') ?? '/dashboard';

    /** Fehler aus dem OAuth-Callback. */
    const callbackError = searchParams.get('error');

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [mode, setMode] = useState<'login' | 'signup'>('login');
    const [loading, setLoading] = useState<'google' | 'email' | null>(null);
    const [error, setError] = useState<string | null>(callbackError);
    const [signupSuccess, setSignupSuccess] = useState(false);

    const handleGoogle = async () => {
        setLoading('google');
        setError(null);
        const { error } = await signInWithGoogle();
        if (error) {
            setError(error);
            setLoading(null);
        }
    };

    const handleEmailSubmit = async () => {
        if (!email.trim()) {
            setError('Please enter your email address.');
            return;
        }
        if (!password) {
            setError('Please enter your password.');
            return;
        }

        setLoading('email');
        setError(null);

        if (mode === 'signup') {
            const { error } = await signUpWithEmail(email, password);
            setLoading(null);
            if (error) {
                setError(error);
            } else {
                setSignupSuccess(true);
            }
        } else {
            const { error } = await signInWithEmail(email, password);
            setLoading(null);
            if (error) {
                setError(error);
            } else {
                window.location.href = next;
            }
        }
    };

    // Bestätigungsansicht nach Registrierung
    if (signupSuccess) {
        return (
            <main className="min-h-screen flex flex-col items-center justify-center px-4">
                <div className="w-full max-w-md text-center space-y-6 animate-fade-up">
                    <div className="text-5xl">📬</div>
                    <h1 className="text-2xl tracking-tight">Check your email</h1>
                    <p className="font-light" style={{ color: 'hsl(var(--muted-foreground))' }}>
                        We&apos;ve sent a confirmation link to <strong style={{ color: 'hsl(var(--foreground))' }}>{email}</strong>.
                        Click the link to activate your account.
                    </p>
                    <button
                        onClick={() => { setSignupSuccess(false); setMode('login'); }}
                        className="text-sm font-light transition-colors hover:opacity-100"
                        style={{ color: 'hsl(var(--muted-foreground))' }}
                    >
                        Back to login
                    </button>
                </div>
            </main>
        );
    }

    return (
        <main className="flex min-h-screen flex-col items-center justify-center px-4">
            <div className="w-full max-w-md space-y-6 text-center animate-fade-up">
                <h1 className="text-4xl tracking-tight">
                    Cloudyard
                </h1>
                <AnimatePresence mode="wait">
                    <motion.p
                        key={mode}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.25 }}
                        className="font-light"
                        style={{ color: 'hsl(var(--muted-foreground))' }}
                    >
                        {mode === 'login' ? 'Sign in to manage your memorials' : 'Create your account'}
                    </motion.p>
                </AnimatePresence>

                <div className="space-y-4">
                    {/* Google OAuth Button */}
                    <button
                        onClick={handleGoogle}
                        disabled={!!loading}
                        id="btn-google-login"
                        className="w-full rounded-lg py-4 flex items-center justify-center gap-3 text-sm font-normal shadow-sm transition-shadow duration-200 hover:shadow-md disabled:opacity-50"
                        style={{
                            backgroundColor: 'hsl(var(--card))',
                            color: 'hsl(var(--foreground))',
                            border: '1px solid hsl(var(--border) / 0.6)',
                        }}
                    >
                        {loading === 'google' ? (
                            <span className="animate-spin w-5 h-5 border-2 border-current border-t-transparent rounded-full" style={{ borderColor: 'hsl(var(--muted-foreground))', borderTopColor: 'transparent' }} />
                        ) : (
                            <svg className="h-5 w-5" viewBox="0 0 24 24">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                            </svg>
                        )}
                        Continue with Google
                    </button>

                    {/* Divider */}
                    <div className="flex items-center gap-4">
                        <div className="h-px flex-1" style={{ backgroundColor: 'hsl(var(--border) / 0.6)' }} />
                        <span className="text-xs font-light" style={{ color: 'hsl(var(--muted-foreground))' }}>or</span>
                        <div className="h-px flex-1" style={{ backgroundColor: 'hsl(var(--border) / 0.6)' }} />
                    </div>

                    {/* Email + Password */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={mode}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.3, ease: 'easeOut' }}
                            className="space-y-4"
                        >
                            <input
                                id="input-email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="your@email.com"
                                disabled={!!loading}
                                className="field-input transition-opacity duration-200"
                                style={{ opacity: loading ? 0.5 : 1 }}
                            />
                            <input
                                id="input-password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleEmailSubmit()}
                                placeholder={mode === 'signup' ? 'Choose a password (min. 6 characters)' : 'Password'}
                                disabled={!!loading}
                                className="field-input transition-opacity duration-200"
                                style={{ opacity: loading ? 0.5 : 1 }}
                            />
                            <button
                                onClick={handleEmailSubmit}
                                disabled={!!loading}
                                id="btn-email-login"
                                className="w-full rounded-full py-4 text-xs font-normal uppercase tracking-[0.25em] shadow-sm transition-all duration-300 hover:shadow-md disabled:opacity-70 flex items-center justify-center gap-2"
                                style={{
                                    backgroundColor: 'hsl(var(--primary))',
                                    color: 'hsl(var(--primary-foreground))',
                                }}
                            >
                                {loading === 'email' ? (
                                    <>
                                        <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                                        <span>{mode === 'login' ? 'Signing in...' : 'Creating account...'}</span>
                                    </>
                                ) : (
                                    mode === 'login' ? 'Sign In' : 'Create Account'
                                )}
                            </button>
                        </motion.div>
                    </AnimatePresence>

                    {/* Toggle Login / Sign Up */}
                    <AnimatePresence mode="wait">
                        <motion.p
                            key={mode}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="text-sm font-light"
                            style={{ color: 'hsl(var(--muted-foreground))' }}
                        >
                            {mode === 'login' ? (
                                <>
                                    Don&apos;t have an account?{' '}
                                    <button
                                        type="button"
                                        onClick={() => { setMode('signup'); setError(null); }}
                                        className="underline underline-offset-4 transition-colors hover:opacity-100"
                                        style={{ color: 'hsl(var(--foreground) / 0.7)' }}
                                    >
                                        Sign up
                                    </button>
                                </>
                            ) : (
                                <>
                                    Already have an account?{' '}
                                    <button
                                        type="button"
                                        onClick={() => { setMode('login'); setError(null); }}
                                        className="underline underline-offset-4 transition-colors hover:opacity-100"
                                        style={{ color: 'hsl(var(--foreground) / 0.7)' }}
                                    >
                                        Sign in
                                    </button>
                                </>
                            )}
                        </motion.p>
                    </AnimatePresence>

                    {/* Fehlermeldung */}
                    {error && (
                        <p role="alert" className="text-sm rounded-lg px-4 py-3 text-center"
                            style={{
                                color: 'hsl(var(--destructive))',
                                backgroundColor: 'hsl(var(--destructive) / 0.05)',
                                border: '1px solid hsl(var(--destructive) / 0.2)',
                            }}
                        >
                            {error}
                        </p>
                    )}
                </div>

                {/* Zurück-Link */}
                <Link
                    href="/"
                    className="inline-block text-sm font-light transition-colors hover:opacity-100"
                    style={{ color: 'hsl(var(--muted-foreground))' }}
                >
                    ← Back to Home
                </Link>

                {/* Hidden next-param für den Callback */}
                <input type="hidden" name="next" value={next} />
            </div>
        </main>
    );
}

/** Seiten-Einstiegspunkt mit Suspense-Wrapper. */
export default function LoginPage() {
    return (
        <Suspense fallback={
            <main className="min-h-screen flex items-center justify-center">
                <span className="animate-spin w-8 h-8 border-2 border-t-transparent rounded-full" style={{ borderColor: 'hsl(var(--muted-foreground))', borderTopColor: 'transparent' }} />
            </main>
        }>
            <LoginForm />
        </Suspense>
    );
}
