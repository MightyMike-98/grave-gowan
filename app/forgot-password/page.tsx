/**
 * @file app/forgot-password/page.tsx
 * @description Seite zum Anfordern eines Passwort-Reset-Links.
 *
 * Der Nutzer gibt seine E-Mail-Adresse ein, und Supabase sendet einen
 * Link, der zurück zu `/auth/callback?next=/reset-password` führt.
 */

'use client';

import { resetPassword } from '@data/auth';
import { translateAuthError } from '@/lib/auth-errors';
import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

export default function ForgotPasswordPage() {
    const t = useTranslations('forgotPassword');
    const tErr = useTranslations('authErrors');
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [sent, setSent] = useState(false);

    const handleSubmit = async () => {
        if (!email.trim()) {
            setError(t('errorEnterEmail'));
            return;
        }
        setLoading(true);
        setError(null);
        const { error: err } = await resetPassword(email);
        setLoading(false);
        if (err) {
            setError(translateAuthError(err, tErr));
        } else {
            setSent(true);
        }
    };

    if (sent) {
        return (
            <main className="min-h-screen flex flex-col items-center justify-center px-4">
                <div className="w-full max-w-md text-center space-y-6 animate-fade-up">
                    <div className="text-5xl">📬</div>
                    <h1 className="text-2xl tracking-tight">{t('checkEmail')}</h1>
                    <p className="font-light" style={{ color: 'hsl(var(--muted-foreground))' }}>
                        {t('sentTo', { email })}
                    </p>
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
                        type="email"
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); setError(null); }}
                        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                        placeholder={t('emailPlaceholder')}
                        disabled={loading}
                        className="field-input transition-opacity duration-200"
                        style={{ opacity: loading ? 0.5 : 1 }}
                    />
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="w-full rounded-full py-4 text-xs font-normal uppercase tracking-[0.25em] shadow-sm transition-all duration-300 hover:shadow-md disabled:opacity-70 flex items-center justify-center gap-2"
                        style={{
                            backgroundColor: 'hsl(var(--primary))',
                            color: 'hsl(var(--primary-foreground))',
                        }}
                    >
                        {loading ? (
                            <>
                                <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                                <span>{t('sending')}</span>
                            </>
                        ) : (
                            t('sendLink')
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
