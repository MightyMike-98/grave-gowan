'use client';

import { createSupabaseBrowserClient } from '@data/browser-client';
import { useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

function SetupForm() {
    const t = useTranslations('setup');
    const router = useRouter();
    const searchParams = useSearchParams();
    const next = searchParams.get('next') ?? '/dashboard';
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Namen aus bestehenden Metadaten vorausfüllen (z.B. Google-Profil)
    useEffect(() => {
        const supabase = createSupabaseBrowserClient();
        supabase.auth.getUser().then(({ data }) => {
            const existing = data.user?.user_metadata?.full_name as string | undefined;
            if (existing) setName(existing);
        });
    }, []);

    const handleSave = async () => {
        const trimmed = name.trim();
        if (!trimmed) {
            setError(t('errorEnterName'));
            return;
        }

        setLoading(true);
        setError(null);

        const supabase = createSupabaseBrowserClient();
        const { error: updateError } = await supabase.auth.updateUser({
            data: { full_name: trimmed, setup_complete: true },
        });

        if (updateError) {
            setError(updateError.message);
            setLoading(false);
            return;
        }

        router.push(next);
    };

    return (
        <main className="flex min-h-screen flex-col items-center justify-center px-4">
            <div className="w-full max-w-md space-y-6 text-center animate-fade-up">
                <h1 className="text-4xl tracking-tight">{t('heading')}</h1>
                <p className="font-light" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    {t('subtext')}
                </p>

                <div className="space-y-4 text-left">
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                        placeholder={t('namePlaceholder')}
                        autoFocus
                        className="field-input"
                    />

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

                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="w-full rounded-full py-4 text-xs font-normal uppercase tracking-[0.25em] shadow-sm transition-all duration-300 hover:shadow-md disabled:opacity-70 flex items-center justify-center gap-2"
                        style={{
                            backgroundColor: 'hsl(var(--primary))',
                            color: 'hsl(var(--primary-foreground))',
                        }}
                    >
                        {loading ? (
                            <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                        ) : (
                            t('continue')
                        )}
                    </button>
                </div>
            </div>
        </main>
    );
}

export default function SetupPage() {
    return (
        <Suspense fallback={
            <main className="min-h-screen flex items-center justify-center">
                <span className="animate-spin w-8 h-8 border-2 border-t-transparent rounded-full" style={{ borderColor: 'hsl(var(--muted-foreground))', borderTopColor: 'transparent' }} />
            </main>
        }>
            <SetupForm />
        </Suspense>
    );
}
