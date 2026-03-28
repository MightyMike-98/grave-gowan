'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { FormField } from './FormField';

export interface TimelineEventDraft {
    year: string;
    title: string;
    description: string;
}

interface TimelineEditorProps {
    events: TimelineEventDraft[];
    onChange: (events: TimelineEventDraft[]) => void;
}

export function TimelineEditor({ events, onChange }: TimelineEditorProps) {
    const t = useTranslations('create');
    const [tempYear, setTempYear] = useState('');
    const [tempTitle, setTempTitle] = useState('');
    const [tempDesc, setTempDesc] = useState('');

    const addEvent = () => {
        if (!tempYear || !tempTitle) {
            alert(t('errorYearTitle'));
            return;
        }
        onChange([...events, { year: tempYear, title: tempTitle, description: tempDesc }]);
        setTempYear('');
        setTempTitle('');
        setTempDesc('');
    };

    const removeEvent = (index: number) => {
        onChange(events.filter((_, i) => i !== index));
    };

    return (
        <section className="pt-12 space-y-5">
            <div className="mb-8 h-px" style={{ backgroundColor: 'hsl(var(--border) / 0.4)' }} />
            <h2 className="text-xl tracking-tight">{t('sectionLifeTimeline')}</h2>

            <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                    <label htmlFor="tl-year" className="block text-[11px] font-medium uppercase tracking-[0.15em]" style={{ color: 'hsl(var(--muted-foreground))' }}>{t('fieldYear')}</label>
                    <input id="tl-year" type="text" value={tempYear} onChange={(e) => setTempYear(e.target.value)} placeholder={t('placeholderYear')} className="field-input" />
                </div>
                <div className="col-span-2 space-y-1">
                    <label htmlFor="tl-title" className="block text-[11px] font-medium uppercase tracking-[0.15em]" style={{ color: 'hsl(var(--muted-foreground))' }}>{t('fieldTitle')}</label>
                    <input id="tl-title" type="text" value={tempTitle} onChange={(e) => setTempTitle(e.target.value)} placeholder={t('placeholderEventTitle')} className="field-input" />
                </div>
            </div>

            <FormField label={t('fieldDescOptional')}>
                <input id="tl-desc" type="text" value={tempDesc} onChange={(e) => setTempDesc(e.target.value)} placeholder={t('placeholderDetails')} className="field-input" />
            </FormField>

            <button
                type="button"
                onClick={addEvent}
                className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-light shadow-sm transition-colors"
                style={{ color: 'hsl(var(--foreground))', border: '1px solid hsl(var(--border) / 0.6)' }}
            >
                + {t('addButton')}
            </button>

            {events.length > 0 && (
                <div className="space-y-3">
                    {events.map((event, i) => (
                        <div
                            key={i}
                            className="flex items-start gap-3 rounded-xl p-4 shadow-sm bg-white"
                            style={{ borderColor: 'hsl(var(--border) / 0.4)' }}
                        >
                            <span className="text-sm font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>{event.year}</span>
                            <div className="flex-1">
                                <p className="text-sm font-medium" style={{ fontFamily: 'var(--font-inter)', color: 'hsl(var(--foreground))' }}>{event.title}</p>
                                {event.description && (
                                    <p className="mt-1 text-xs font-light leading-relaxed line-clamp-3" style={{ color: 'hsl(var(--muted-foreground))' }}>{event.description}</p>
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={() => removeEvent(i)}
                                aria-label={`Remove ${event.title}`}
                                className="transition-colors"
                                style={{ color: 'hsl(var(--destructive) / 0.7)' }}
                            >
                                ×
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}
