/**
 * @file app/reset-password/page.tsx
 * @description Seite zum Setzen eines neuen Passworts.
 *
 * Wird nach dem Klick auf den Reset-Link aus der E-Mail angezeigt.
 * Der Nutzer ist zu diesem Zeitpunkt bereits über den Auth-Callback
 * eingeloggt und kann sein Passwort direkt aktualisieren.
 */

'use client';

import { updatePassword } from '@data/auth';
import { createSupabaseBrowserClient } from '@data/browser-client';
import { translateAuthError } from '@/lib/auth-errors';
import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

export default function ResetPasswordPage() {
    const t = useTranslations('resetPassword');
    const tErr = useTranslations('authErrors');
    const router = useRouter();
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [done, setDone] = useState(false);
    const [sessionReady, setSessionReady] = useState(false);

    // Prüfen, ob der Nutzer durch den Reset-Link eine gültige Session hat
    useEffect(() => {
        const check = async () => {
            const supabase = createSupabaseBrowserClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setError(t('errorInvalidLink'));
            }
            setSessionReady(true);
        };
        check();
    }, [t]);

    const handleSubmit = async () => {
        if (!password || password.length < 6) {
            setError(t('errorTooShort'));
            return;
        }
        if (password !== confirm) {
            setError(t('errorMismatch'));
            return;
        }
        setLoading(true);
        setError(null);
        const { error: err } = await updatePassword(password);
        setLoading(false);
        if (err) {
            setError(translateAuthError(err, tErr));
        } else {
            setDone(true);
            setTimeout(() => router.push('/dashboard'), 1800);
        }
    };

    if (done) {
        return (
            <main className="min-h-screen flex flex-col items-center justify-center px-4">
                <div className="w-full max-w-md text-center space-y-6 animate-fade-up">
                    <div className="text-5xl">✓</div>
                    <h1 className="text-2xl tracking-tight">{t('success')}</h1>
                    <p className="font-light" style={{ color: 'hsl(var(--muted-foreground))' }}>
                        {t('redirecting')}
                    </p>
                </div>
            </main>
        );
    }

    return (
        <main className="flex min-h-screen flex-col items-center justify-center px-4">
            <div className="w-full max-w-md space-y-6 text-center animate-fade-up">
                <h1 className="text-4xl tracking-tight">{t('heading')}</h1>
                <AnimatePresence mode="wait">
                    <motion.p
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25 }}
                        className="font-light"
                        style={{ color: 'hsl(var(--muted-foreground))' }}
                    >
                        {t('subtext')}
                    </motion.p>
                </AnimatePresence>

                <div className="space-y-4">
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => { setPassword(e.target.value); setError(null); }}
                        placeholder={t('newPasswordPlaceholder')}
                        disabled={loading || !sessionReady}
                        className="field-input transition-opacity duration-200"
                        style={{ opacity: loading ? 0.5 : 1 }}
                    />
                    <input
                        type="password"
                        value={confirm}
                        onChange={(e) => { setConfirm(e.target.value); setError(null); }}
                        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                        placeholder={t('confirmPasswordPlaceholder')}
                        disabled={loading || !sessionReady}
                        className="field-input transition-opacity duration-200"
                        style={{ opacity: loading ? 0.5 : 1 }}
                    />
                    <button
                        onClick={handleSubmit}
                        disabled={loading || !sessionReady}
                        className="w-full rounded-full py-4 text-xs font-normal uppercase tracking-[0.25em] shadow-sm transition-all duration-300 hover:shadow-md disabled:opacity-70 flex items-center justify-center gap-2"
                        style={{
                            backgroundColor: 'hsl(var(--primary))',
                            color: 'hsl(var(--primary-foreground))',
                        }}
                    >
                        {loading ? (
                            <>
                                <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                                <span>{t('updating')}</span>
                            </>
                        ) : (
                            t('updatePassword')
                        )}
                    </button>

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

                <Link
                    href="/login"
                    className="inline-block text-sm font-light transition-colors hover:opacity-100"
                    style={{ color: 'hsl(var(--muted-foreground))' }}
                >
                    {t('backToLogin')}
                </Link>
            </div>
        </main>
    );
}
