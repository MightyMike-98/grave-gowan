import { LanguageToggle } from '@/components/ui/LanguageToggle';
import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
    title: 'Cloudyard — Honor Loved Ones',
    description: 'Create and visit digital memorial spaces for the ones you love.',
};

export default async function LandingPage() {
    const t = await getTranslations('landing');

    return (
        <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4">
            {/* Subtle radial glow */}
            <div
                className="pointer-events-none absolute inset-0"
                style={{
                    background: `radial-gradient(ellipse 80% 60% at 50% 40%, hsl(230 40% 92% / 0.6), transparent)`,
                }}
            />

            {/* Language toggle — top right */}
            <div className="absolute top-6 right-6">
                <LanguageToggle />
            </div>

            <div className="relative flex flex-col items-center gap-5 text-center">
                <h1 className="text-5xl tracking-tight md:text-7xl animate-fade-up">
                    Cloudyard
                </h1>

                <p className="max-w-sm text-lg font-light animate-fade-up" style={{ color: 'hsl(var(--muted-foreground))', animationDelay: '0.15s' }}>
                    {t('tagline')}
                </p>

                <div className="mt-6 flex flex-col items-center gap-4 animate-fade-up" style={{ animationDelay: '0.3s' }}>
                    <Link
                        href="/visit"
                        className="w-72 rounded-full py-4 text-center text-xs font-normal uppercase tracking-[0.25em] shadow-sm transition-shadow duration-300 hover:shadow-md"
                        style={{
                            backgroundColor: 'hsl(var(--primary))',
                            color: 'hsl(var(--primary-foreground))',
                        }}
                    >
                        {t('visitMemorial')}
                    </Link>

                    <Link
                        href="/login"
                        className="mt-1 text-sm font-normal transition-colors hover:opacity-100"
                        style={{ color: 'hsl(var(--foreground) / 0.7)' }}
                    >
                        {t('login')}
                    </Link>

                    <Link
                        href="/memorial/demo"
                        className="text-sm font-light transition-colors hover:opacity-100"
                        style={{ color: 'hsl(var(--muted-foreground))' }}
                    >
                        {t('viewExample')}
                    </Link>
                </div>
            </div>
        </main>
    );
}
