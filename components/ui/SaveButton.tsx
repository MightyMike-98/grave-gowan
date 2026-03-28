'use client';

import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';

interface SaveButtonProps {
    memorialId: string;
    memorialSlug: string;
    isAuthenticated: boolean;
    initialSaved?: boolean;
}

export function SaveButton({ memorialId, memorialSlug, isAuthenticated, initialSaved = false }: SaveButtonProps) {
    const t = useTranslations('save');
    const [saved, setSaved] = useState(initialSaved);
    const [showTooltip, setShowTooltip] = useState(false);
    const [saving, setSaving] = useState(false);
    const tooltipRef = useRef<HTMLDivElement>(null);

    const doSave = async () => {
        setSaving(true);
        try {
            const res = await fetch('/api/memorials/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ memorialId }),
            });
            const json = await res.json();
            if (res.ok) setSaved(json.saved);
        } catch (err) {
            console.error('[SaveButton]', err);
        }
        setSaving(false);
    };

    // Auto-save nach Login-Redirect (?save=1 in URL)
    useEffect(() => {
        if (!isAuthenticated || saved) return;
        const params = new URLSearchParams(window.location.search);
        if (params.get('save') === '1') {
            doSave();
            // URL aufräumen
            const clean = window.location.pathname;
            window.history.replaceState({}, '', clean);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAuthenticated]);

    // Close tooltip on outside click
    useEffect(() => {
        if (!showTooltip) return;
        const handler = (e: MouseEvent) => {
            if (tooltipRef.current && !tooltipRef.current.contains(e.target as Node)) {
                setShowTooltip(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [showTooltip]);

    const handleClick = async () => {
        if (!isAuthenticated) {
            setShowTooltip(true);
            return;
        }
        await doSave();
    };

    const loginUrl = `/login?next=${encodeURIComponent(`/memorial/${memorialSlug}?save=1`)}`;

    return (
        <div className="relative" ref={tooltipRef}>
            <button
                onClick={handleClick}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-light backdrop-blur-sm transition-all duration-200 hover:shadow-md disabled:opacity-50"
                style={{
                    backgroundColor: 'hsl(var(--foreground) / 0.05)',
                    color: saved ? 'hsl(var(--foreground))' : 'hsl(var(--foreground) / 0.6)',
                }}
            >
                <svg className="h-4 w-4" fill={saved ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" />
                </svg>
                {saved ? t('saved') : t('save')}
            </button>

            <AnimatePresence>
                {showTooltip && (
                    <motion.div
                        initial={{ opacity: 0, y: -4, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -4, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-2 w-64 rounded-xl p-4 shadow-lg z-50"
                        style={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border) / 0.4)' }}
                    >
                        <p className="text-sm font-light" style={{ color: 'hsl(var(--foreground))' }}>
                            <Link href={loginUrl} className="font-medium underline underline-offset-2">{t('signIn')}</Link>
                            {' '}{t('signInHint')}
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
