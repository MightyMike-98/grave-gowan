/**
 * @file app/invite/accept/page.tsx
 * @description Seite, auf der eine Editor-Einladung angenommen wird.
 *
 * Der Nutzer klickt in seiner E-Mail auf den Bestätigungslink und landet hier.
 * Ist er nicht eingeloggt, wird er zum Login weitergeleitet (mit `next`
 * zurück auf diese Seite). Ist er eingeloggt, wird sein `memorial_members`-
 * Eintrag von `pending` auf `accepted` gesetzt und `user_id` verknüpft.
 */

'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

type Status = 'loading' | 'success' | 'error' | 'login';

function AcceptInviteForm() {
    const t = useTranslations('invite');
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get('token');

    const [status, setStatus] = useState<Status>('loading');
    const [errorMsg, setErrorMsg] = useState('');
    const [memorialId, setMemorialId] = useState('');

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setErrorMsg(t('errorInvalidLink'));
            return;
        }

        const accept = async () => {
            try {
                const res = await fetch('/api/members/accept', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token }),
                });

                if (res.status === 401) {
                    setStatus('login');
                    return;
                }

                const data = await res.json();

                if (!res.ok) {
                    setStatus('error');
                    setErrorMsg(data.error || t('errorGeneric'));
                    return;
                }

                setMemorialId(data.memorialId);
                setStatus('success');
            } catch {
                setStatus('error');
                setErrorMsg(t('errorGeneric'));
            }
        };

        accept();
    }, [token, t]);

    return (
        <main className="flex min-h-screen flex-col items-center justify-center px-4">
            <div className="w-full max-w-md text-center animate-fade-up">
                <AnimatePresence mode="wait">
                    {status === 'loading' && (
                        <motion.div
                            key="loading"
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            transition={{ duration: 0.25 }}
                            className="space-y-6"
                        >
                            <div className="flex justify-center">
                                <span
                                    className="animate-spin w-8 h-8 border-2 rounded-full"
                                    style={{ borderColor: 'hsl(var(--muted-foreground) / 0.3)', borderTopColor: 'hsl(var(--foreground))' }}
                                />
                            </div>
                            <p className="font-light" style={{ color: 'hsl(var(--muted-foreground))' }}>
                                {t('accepting')}
                            </p>
                        </motion.div>
                    )}

                    {status === 'success' && (
                        <motion.div
                            key="success"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.3, ease: 'easeOut' }}
                            className="space-y-6"
                        >
                            <div
                                className="mx-auto w-16 h-16 rounded-full flex items-center justify-center"
                                style={{
                                    background: 'linear-gradient(135deg, hsl(var(--primary) / 0.1), hsl(var(--primary) / 0.05))',
                                    border: '1px solid hsl(var(--primary) / 0.15)',
                                }}
                            >
                                <svg className="w-7 h-7" style={{ color: 'hsl(var(--primary))' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h1 className="text-3xl tracking-tight">{t('acceptedHeading')}</h1>
                            <p className="font-light" style={{ color: 'hsl(var(--muted-foreground))' }}>
                                {t('acceptedText')}
                            </p>
                            <div className="flex flex-col gap-3 pt-2">
                                <button
                                    onClick={() => router.push(`/create?id=${memorialId}`)}
                                    className="w-full rounded-full py-4 text-xs font-normal uppercase tracking-[0.25em] shadow-sm transition-all duration-300 hover:shadow-md"
                                    style={{
                                        backgroundColor: 'hsl(var(--primary))',
                                        color: 'hsl(var(--primary-foreground))',
                                    }}
                                >
                                    {t('editMemorial')}
                                </button>
                                <button
                                    onClick={() => router.push('/dashboard')}
                                    className="w-full rounded-full py-4 text-xs font-normal uppercase tracking-[0.25em] shadow-sm transition-shadow duration-300 hover:shadow-md"
                                    style={{
                                        backgroundColor: 'hsl(var(--card))',
                                        color: 'hsl(var(--foreground))',
                                        border: '1px solid hsl(var(--border) / 0.6)',
                                    }}
                                >
                                    {t('toDashboard')}
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {status === 'login' && (
                        <motion.div
                            key="login"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.3, ease: 'easeOut' }}
                            className="space-y-6"
                        >
                            <div className="text-5xl">✉️</div>
                            <h1 className="text-3xl tracking-tight">{t('loginRequiredHeading')}</h1>
                            <p className="font-light" style={{ color: 'hsl(var(--muted-foreground))' }}>
                                {t('loginRequiredText')}
                            </p>
                            <button
                                onClick={() => router.push(`/login?next=${encodeURIComponent(`/invite/accept?token=${token}`)}`)}
                                className="w-full rounded-full py-4 text-xs font-normal uppercase tracking-[0.25em] shadow-sm transition-all duration-300 hover:shadow-md"
                                style={{
                                    backgroundColor: 'hsl(var(--primary))',
                                    color: 'hsl(var(--primary-foreground))',
                                }}
                            >
                                {t('signIn')}
                            </button>
                        </motion.div>
                    )}

                    {status === 'error' && (
                        <motion.div
                            key="error"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.3, ease: 'easeOut' }}
                            className="space-y-6"
                        >
                            <div
                                className="mx-auto w-16 h-16 rounded-full flex items-center justify-center"
                                style={{
                                    background: 'linear-gradient(135deg, hsl(var(--destructive) / 0.1), hsl(var(--destructive) / 0.05))',
                                    border: '1px solid hsl(var(--destructive) / 0.15)',
                                }}
                            >
                                <svg className="w-7 h-7" style={{ color: 'hsl(var(--destructive))' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </div>
                            <h1 className="text-3xl tracking-tight">{t('errorHeading')}</h1>
                            <p className="font-light" style={{ color: 'hsl(var(--muted-foreground))' }}>
                                {errorMsg}
                            </p>
                            <button
                                onClick={() => router.push('/dashboard')}
                                className="w-full rounded-full py-4 text-xs font-normal uppercase tracking-[0.25em] shadow-sm transition-shadow duration-300 hover:shadow-md"
                                style={{
                                    backgroundColor: 'hsl(var(--card))',
                                    color: 'hsl(var(--foreground))',
                                    border: '1px solid hsl(var(--border) / 0.6)',
                                }}
                            >
                                {t('toDashboard')}
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </main>
    );
}

export default function AcceptInvitePage() {
    return (
        <Suspense fallback={
            <main className="min-h-screen flex items-center justify-center">
                <span className="animate-spin w-8 h-8 border-2 rounded-full" style={{ borderColor: 'hsl(var(--muted-foreground) / 0.3)', borderTopColor: 'hsl(var(--foreground))' }} />
            </main>
        }>
            <AcceptInviteForm />
        </Suspense>
    );
}
