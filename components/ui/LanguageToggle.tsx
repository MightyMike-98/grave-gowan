'use client';

import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';

export function LanguageToggle() {
    const locale = useLocale();
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const setLocale = (newLocale: string) => {
        if (newLocale === locale) return;
        document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;
        startTransition(() => {
            router.refresh();
        });
    };

    return (
        <div
            className="flex items-center gap-2 text-sm font-light tracking-[0.1em]"
            style={{ opacity: isPending ? 0.5 : 1, transition: 'opacity 0.2s' }}
        >
            <button
                onClick={() => setLocale('de')}
                style={{
                    color: locale === 'de' ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground) / 0.4)',
                    fontWeight: locale === 'de' ? 400 : 300,
                    transition: 'color 0.2s',
                }}
            >
                DE
            </button>
            <span style={{ color: 'hsl(var(--muted-foreground) / 0.3)' }}>/</span>
            <button
                onClick={() => setLocale('en')}
                style={{
                    color: locale === 'en' ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground) / 0.4)',
                    fontWeight: locale === 'en' ? 400 : 300,
                    transition: 'color 0.2s',
                }}
            >
                EN
            </button>
        </div>
    );
}
