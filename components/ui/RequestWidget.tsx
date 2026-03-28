'use client';

import { submitVisitorRequest } from '@/app/actions/submitVisitorRequest';
import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useRef, useState } from 'react';

const categories = ['Gallery', 'Highlights', 'Biography', 'Stories', 'Allgemein'] as const;

interface RequestWidgetProps {
    memorialId?: string;
    memorialSlug?: string;
    isAuthenticated?: boolean;
}

export function RequestWidget({ memorialId, memorialSlug, isAuthenticated = false }: RequestWidgetProps) {
    const t = useTranslations('request');
    const [open, setOpen] = useState(false);
    const [showAuthHint, setShowAuthHint] = useState(false);
    const [category, setCategory] = useState<string>(categories[0]);
    const [authorName, setAuthorName] = useState('');
    const [message, setMessage] = useState('');
    const [image, setImage] = useState<File | null>(null);
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    const handleSend = async () => {
        if (!message.trim() || !authorName.trim() || !memorialId) return;

        setSending(true);
        try {
            const result = await submitVisitorRequest(
                memorialId,
                authorName.trim(),
                category,
                message.trim(),
                image ?? undefined,
            );
            if (result.error) {
                console.error('[RequestWidget] Error:', result.error);
                return;
            }

            setSent(true);
            setTimeout(() => {
                setSent(false);
                setOpen(false);
                setMessage('');
                setAuthorName('');
                setImage(null);
                setCategory(categories[0]);
            }, 2000);
        } catch (err) {
            console.error('[RequestWidget] Error:', err);
        } finally {
            setSending(false);
        }
    };

    const reset = () => {
        setOpen(false);
        setMessage('');
        setAuthorName('');
        setImage(null);
        setCategory(categories[0]);
    };

    return (
        <>
            {/* Floating button — bottom right */}
            {!open && (
                <div className="fixed bottom-6 right-6 z-50">
                    <motion.button
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 1, type: 'spring', bounce: 0.4 }}
                        onClick={() => {
                            if (!isAuthenticated) { setShowAuthHint(true); return; }
                            setOpen(true);
                        }}
                        className="flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-transform hover:scale-105"
                        style={{ backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
                        title={t('title')}
                    >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </motion.button>

                    <AnimatePresence>
                        {showAuthHint && (
                            <motion.div
                                initial={{ opacity: 0, y: 4, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 4, scale: 0.95 }}
                                transition={{ duration: 0.15 }}
                                className="absolute bottom-full right-0 mb-2 w-64 rounded-xl p-4 shadow-lg"
                                style={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border) / 0.4)' }}
                            >
                                <p className="text-sm font-light" style={{ color: 'hsl(var(--foreground))' }}>
                                    <Link href={`/login?next=${encodeURIComponent(`/memorial/${memorialSlug ?? ''}`)}`} className="font-medium underline underline-offset-2">{t('signIn')}</Link>
                                    {' '}{t('signInHint')}
                                </p>
                                <button
                                    onClick={() => setShowAuthHint(false)}
                                    className="absolute top-2 right-2 transition-colors"
                                    style={{ color: 'hsl(var(--muted-foreground) / 0.5)' }}
                                >
                                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}

            {/* Panel — opens bottom-right */}
            <AnimatePresence>
                {open && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 backdrop-blur-sm"
                            style={{ backgroundColor: 'hsl(var(--background) / 0.6)' }}
                            onClick={reset}
                        />

                        {/* Panel */}
                        <motion.div
                            initial={{ opacity: 0, y: 30, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 30, scale: 0.95 }}
                            transition={{ duration: 0.25, ease: 'easeOut' }}
                            className="fixed bottom-6 right-6 z-50 w-[340px] rounded-xl border shadow-xl overflow-hidden"
                            style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border) / 0.5)' }}
                        >
                            {sent ? (
                                <div className="flex flex-col items-center justify-center py-10 px-6 text-center space-y-2">
                                    <span className="text-3xl">✅</span>
                                    <h3 className="text-base tracking-tight" style={{ color: 'hsl(var(--foreground))' }}>{t('sent')}</h3>
                                    <p className="text-xs font-light" style={{ color: 'hsl(var(--muted-foreground))' }}>
                                        {t('sentSubtext')}
                                    </p>
                                </div>
                            ) : (
                                <div className="p-5 space-y-4">
                                    {/* Header */}
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h3 className="text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>{t('title')}</h3>
                                            <p className="text-[11px] font-light mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
                                                {t('subtext')}
                                            </p>
                                        </div>
                                        <button
                                            onClick={reset}
                                            className="transition-colors hover:opacity-70 -mt-0.5"
                                            style={{ color: 'hsl(var(--muted-foreground))' }}
                                        >
                                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>

                                    {/* Author name */}
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-medium uppercase tracking-[0.1em]" style={{ color: 'hsl(var(--muted-foreground))' }}>
                                            {t('yourName')}
                                        </label>
                                        <input
                                            type="text"
                                            value={authorName}
                                            onChange={(e) => setAuthorName(e.target.value)}
                                            placeholder={t('namePlaceholder')}
                                            className="w-full rounded-lg border px-3 py-2 text-xs font-light focus:outline-none focus:ring-1"
                                            style={{
                                                backgroundColor: 'hsl(var(--muted) / 0.15)',
                                                borderColor: 'hsl(var(--border) / 0.4)',
                                                color: 'hsl(var(--foreground))',
                                            }}
                                        />
                                    </div>

                                    {/* Category pills */}
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-medium uppercase tracking-[0.1em]" style={{ color: 'hsl(var(--muted-foreground))' }}>
                                            {t('category')}
                                        </label>
                                        <div className="flex flex-wrap gap-1.5">
                                            {categories.map((c) => {
                                                const labelKey = `cat${c.charAt(0).toUpperCase()}${c.slice(1)}` as Parameters<typeof t>[0];
                                                const label = t(labelKey);
                                                return (
                                                    <button
                                                        key={c}
                                                        onClick={() => setCategory(c)}
                                                        className="rounded-full px-3 py-1 text-[11px] font-light transition-all"
                                                        style={{
                                                            backgroundColor: category === c ? 'hsl(var(--foreground))' : 'transparent',
                                                            color: category === c ? 'hsl(var(--background))' : 'hsl(var(--foreground))',
                                                            border: `1px solid ${category === c ? 'hsl(var(--foreground))' : 'hsl(var(--border) / 0.6)'}`,
                                                        }}
                                                    >
                                                        {label}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Message */}
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-medium uppercase tracking-[0.1em]" style={{ color: 'hsl(var(--muted-foreground))' }}>
                                            {t('message')}
                                        </label>
                                        <textarea
                                            value={message}
                                            onChange={(e) => setMessage(e.target.value)}
                                            placeholder={t('messagePlaceholder')}
                                            rows={3}
                                            className="w-full rounded-lg border px-3 py-2 text-xs font-light focus:outline-none focus:ring-1 resize-none"
                                            style={{
                                                backgroundColor: 'hsl(var(--muted) / 0.15)',
                                                borderColor: 'hsl(var(--border) / 0.4)',
                                                color: 'hsl(var(--foreground))',
                                            }}
                                        />
                                    </div>

                                    {/* Image attach */}
                                    <button
                                        type="button"
                                        onClick={() => fileRef.current?.click()}
                                        className="flex items-center gap-2 w-full rounded-lg border px-3 py-2 text-xs font-light transition-colors hover:bg-accent/30"
                                        style={{
                                            borderColor: 'hsl(var(--border) / 0.4)',
                                            color: 'hsl(var(--muted-foreground))',
                                        }}
                                    >
                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
                                        </svg>
                                        {image ? (
                                            <span className="truncate" style={{ color: 'hsl(var(--foreground))' }}>{image.name}</span>
                                        ) : (
                                            <span>{t('attachImage')}</span>
                                        )}
                                    </button>
                                    <input
                                        ref={fileRef}
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp"
                                        className="hidden"
                                        onChange={(e) => setImage(e.target.files?.[0] ?? null)}
                                    />

                                    {/* Send */}
                                    <button
                                        onClick={handleSend}
                                        disabled={sending || !message.trim() || !authorName.trim()}
                                        className="w-full flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-light tracking-wider transition-colors disabled:opacity-40"
                                        style={{
                                            backgroundColor: 'hsl(var(--foreground))',
                                            color: 'hsl(var(--background))',
                                        }}
                                    >
                                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
                                        </svg>
                                        {sending ? t('sending') : t('submit')}
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
