import { getTranslations } from 'next-intl/server';
import Link from 'next/link';

export default async function DatenschutzPage() {
    const t = await getTranslations('datenschutz');

    return (
        <div className="flex min-h-screen flex-col items-center justify-center px-6 py-16" style={{ color: 'hsl(var(--foreground))' }}>
            <div className="max-w-lg space-y-6 text-sm font-light leading-relaxed" style={{ color: 'hsl(var(--muted-foreground))' }}>
                <h1 className="text-lg font-normal" style={{ color: 'hsl(var(--foreground))' }}>{t('title')}</h1>

                <section className="space-y-2">
                    <h2 className="font-normal" style={{ color: 'hsl(var(--foreground))' }}>{t('section1Title')}</h2>
                    <p>{t('section1Text')}</p>
                </section>

                <section className="space-y-2">
                    <h2 className="font-normal" style={{ color: 'hsl(var(--foreground))' }}>{t('section2Title')}</h2>
                    <p>{t('section2Text')}</p>
                </section>

                <section className="space-y-2">
                    <h2 className="font-normal" style={{ color: 'hsl(var(--foreground))' }}>{t('section3Title')}</h2>
                    <p>{t('section3Text')}</p>
                </section>

                <section className="space-y-2">
                    <h2 className="font-normal" style={{ color: 'hsl(var(--foreground))' }}>{t('section4Title')}</h2>
                    <p>{t('section4Text')}</p>
                </section>

                <Link
                    href="/"
                    className="mt-8 inline-block text-xs transition-colors"
                    style={{ color: 'hsl(var(--muted-foreground) / 0.5)' }}
                >
                    {t('back')}
                </Link>
            </div>
        </div>
    );
}
