'use client';

import { POPULAR_CHARITIES } from '@/lib/mock-data';
import { useTranslations } from 'next-intl';
import { FormField } from './FormField';

interface SupportEditorProps {
    supportTitle: string;
    setSupportTitle: (v: string) => void;
    supportUrl: string;
    setSupportUrl: (v: string) => void;
    supportDesc: string;
    setSupportDesc: (v: string) => void;
    showDropdown: boolean;
    setShowDropdown: (v: boolean) => void;
}

export function SupportEditor({
    supportTitle, setSupportTitle, supportUrl, setSupportUrl, supportDesc, setSupportDesc, showDropdown, setShowDropdown,
}: SupportEditorProps) {
    const t = useTranslations('create');

    return (
        <section className="pt-12 space-y-5">
            <div className="mb-8 h-px" style={{ backgroundColor: 'hsl(var(--border) / 0.4)' }} />
            <h2 className="text-xl tracking-tight">{t('sectionDonations')} <span className="text-base font-light" style={{ color: 'hsl(var(--muted-foreground))' }}>{t('sectionOptional')}</span></h2>

            <FormField label={t('fieldCauseTitle')}>
                <div className="relative">
                    <input
                        id="field-support-title"
                        type="text"
                        value={supportTitle}
                        onChange={(e) => setSupportTitle(e.target.value)}
                        placeholder={t('placeholderCauseTitle')}
                        className="field-input pr-12"
                    />
                    <button
                        type="button"
                        onClick={() => setShowDropdown(!showDropdown)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 px-2 py-1 text-sm transition-colors"
                        title={t('popularCauses')}
                    >
                        {showDropdown ? '▲' : '▼'}
                    </button>
                    {showDropdown && (
                        <div className="absolute top-full left-0 right-0 mt-1 rounded-lg overflow-hidden z-20 shadow-lg" style={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
                            {POPULAR_CHARITIES.map((charity, i) => (
                                <button
                                    key={i}
                                    type="button"
                                    onClick={() => {
                                        setSupportTitle(charity.title);
                                        setSupportUrl(charity.url);
                                        setShowDropdown(false);
                                    }}
                                    className="w-full text-left px-4 py-3 text-sm font-light transition-colors last:border-0"
                                    style={{ color: 'hsl(var(--foreground))', borderBottom: '1px solid hsl(var(--border) / 0.4)' }}
                                >
                                    {charity.title}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </FormField>

            <FormField label={t('fieldCauseUrl')}>
                <input id="field-support-url" type="url" value={supportUrl} onChange={(e) => setSupportUrl(e.target.value)} placeholder={t('placeholderCauseUrl')} className="field-input" />
            </FormField>

            <FormField label={t('fieldCauseDesc')}>
                <textarea id="field-support-desc" value={supportDesc} onChange={(e) => setSupportDesc(e.target.value)} placeholder={t('placeholderCauseDesc')} rows={4} className="field-input !h-auto resize-none" />
            </FormField>
        </section>
    );
}
