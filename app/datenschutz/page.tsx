import { getTranslations } from 'next-intl/server';
import Link from 'next/link';

export default async function DatenschutzPage() {
    const t = await getTranslations('datenschutz');

    return (
        <div className="flex min-h-screen flex-col items-center justify-center px-6 py-16" style={{ color: 'hsl(var(--foreground))' }}>
            <div className="max-w-lg space-y-6 text-sm font-light leading-relaxed" style={{ color: 'hsl(var(--muted-foreground))' }}>
                <h1 className="text-lg font-normal uppercase tracking-wider" style={{ color: 'hsl(var(--foreground))' }}>{t('title')}</h1>

                <div className="space-y-1">
                    <p className="font-normal" style={{ color: 'hsl(var(--foreground))' }}>{t('controllerLabel')}</p>
                    <p>{t('controllerAddress')}</p>
                    <p>
                        <span className="font-normal" style={{ color: 'hsl(var(--foreground))' }}>{t('emailLabel')}</span>{' '}
                        <a href={`mailto:${t('email')}`} className="underline underline-offset-2">{t('email')}</a>
                    </p>
                </div>

                <div className="space-y-1">
                    <p className="font-normal" style={{ color: 'hsl(var(--foreground))' }}>{t('dataLabel')}</p>
                    <p>{t('dataText')}</p>
                </div>

                <div className="space-y-1">
                    <p className="font-normal" style={{ color: 'hsl(var(--foreground))' }}>{t('purposeLabel')}</p>
                    <p>{t('purposeText')}</p>
                </div>

                <div className="space-y-1">
                    <p className="font-normal" style={{ color: 'hsl(var(--foreground))' }}>{t('thirdPartyLabel')}</p>
                    <p>{t('thirdPartyText')}</p>
                </div>

                <div className="space-y-1">
                    <p className="font-normal" style={{ color: 'hsl(var(--foreground))' }}>{t('rightsLabel')}</p>
                    <p>
                        {t('rightsText')}{' '}
                        <a href={`mailto:${t('rightsEmail')}`} className="underline underline-offset-2">{t('rightsEmail')}</a>
                    </p>
                </div>

                <p>
                    <span className="font-normal" style={{ color: 'hsl(var(--foreground))' }}>{t('authorityLabel')}</span>{' '}
                    {t('authorityText')}
                </p>

                <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground) / 0.7)' }}>{t('lastUpdated')}</p>

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
