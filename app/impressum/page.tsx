import { getTranslations } from 'next-intl/server';
import Link from 'next/link';

export default async function ImpressumPage() {
    const t = await getTranslations('impressum');

    return (
        <div className="flex min-h-screen flex-col items-center justify-center px-6 py-16" style={{ color: 'hsl(var(--foreground))' }}>
            <div className="max-w-lg space-y-6 text-sm font-light leading-relaxed" style={{ color: 'hsl(var(--muted-foreground))' }}>
                <div className="space-y-1">
                    <h1 className="text-lg font-normal" style={{ color: 'hsl(var(--foreground))' }}>{t('title')}</h1>
                    <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground) / 0.7)' }}>{t('subtitle')}</p>
                </div>

                <div className="space-y-1">
                    <p className="font-normal" style={{ color: 'hsl(var(--foreground))' }}>{t('company')}</p>
                    <p>{t('address1')}</p>
                    <p>{t('address2')}</p>
                    <p>{t('country')}</p>
                </div>

                <div className="space-y-1">
                    <p>
                        <span className="font-normal" style={{ color: 'hsl(var(--foreground))' }}>{t('managingDirectorLabel')}</span>{' '}
                        {t('managingDirectorName')}
                    </p>
                    <p>
                        <span className="font-normal" style={{ color: 'hsl(var(--foreground))' }}>{t('emailLabel')}</span>{' '}
                        <a href={`mailto:${t('email')}`} className="underline underline-offset-2">{t('email')}</a>
                    </p>
                </div>

                <div className="space-y-1">
                    <p>
                        <span className="font-normal" style={{ color: 'hsl(var(--foreground))' }}>{t('courtLabel')}</span>{' '}
                        {t('courtName')}
                    </p>
                    <p>
                        <span className="font-normal" style={{ color: 'hsl(var(--foreground))' }}>{t('regNumberLabel')}</span>{' '}
                        {t('regNumberValue')}
                    </p>
                </div>

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
