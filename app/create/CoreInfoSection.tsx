'use client';

import { useTranslations } from 'next-intl';
import { FormField } from './FormField';

interface CoreInfoSectionProps {
    isOwnerRole: boolean;
    isEditorRole: boolean;
    isEditing: boolean;
    name: string;
    setName: (v: string) => void;
    dateOfBirth: string;
    setDateOfBirth: (v: string) => void;
    dateOfDeath: string;
    setDateOfDeath: (v: string) => void;
    bio: string;
    setBio: (v: string) => void;
    quote: string;
    setQuote: (v: string) => void;
    country: string;
    setCountry: (v: string) => void;
}

/** Formatiert ein ISO-Datum (YYYY-MM-DD) als DD.MM.YYYY */
function formatDate(iso: string) {
    if (!iso) return '—';
    const parts = iso.split('-');
    if (parts.length !== 3) return iso;
    return `${parts[2]}.${parts[1]}.${parts[0]}`;
}

export function CoreInfoSection({
    isOwnerRole, isEditorRole, isEditing,
    name, setName, dateOfBirth, setDateOfBirth, dateOfDeath, setDateOfDeath, bio, setBio, quote, setQuote, country, setCountry,
}: CoreInfoSectionProps) {
    const t = useTranslations('create');

    return (
        <section className="space-y-5">
            <h2 className="text-xl tracking-tight">{t('sectionCoreInfo')}</h2>

            {/* Name */}
            {isOwnerRole ? (
                <FormField label={t('fieldName')} icon="edit">
                    <input id="field-name" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder={t('placeholderName')} className="field-input" />
                </FormField>
            ) : isEditorRole && name ? (
                <FormField label={t('fieldName')} icon="lock">
                    <input type="text" value={name} disabled className="field-input opacity-70 bg-muted/20 cursor-not-allowed" />
                </FormField>
            ) : null}

            {/* Date of Birth */}
            {isEditorRole ? (
                <FormField label={t('fieldDob')} icon="lock">
                    <input type="text" value={formatDate(dateOfBirth)} disabled className="field-input opacity-70 bg-muted/20 cursor-not-allowed" />
                </FormField>
            ) : (
                <FormField label={t('fieldDob')} icon={isEditing ? 'edit' : undefined}>
                    <input id="field-dob" type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} className="field-input" />
                </FormField>
            )}

            {/* Date of Death */}
            <FormField label={t('fieldDod')} icon={isEditing ? 'edit' : undefined}>
                <input id="field-dod" type="date" value={dateOfDeath} onChange={(e) => setDateOfDeath(e.target.value)} className="field-input" />
            </FormField>

            {/* Biography */}
            {isEditorRole ? (
                <FormField label={t('fieldBio')} icon="lock">
                    <textarea value={bio || '—'} disabled rows={5} className="field-input !h-auto min-h-[150px] resize-none opacity-70 bg-muted/20 cursor-not-allowed" />
                </FormField>
            ) : (
                <FormField label={t('fieldBio')} icon={isEditing ? 'edit' : undefined}>
                    <textarea id="field-bio" value={bio} onChange={(e) => setBio(e.target.value)} placeholder={t('placeholderBio')} rows={5} className="field-input !h-auto min-h-[150px] resize-none" />
                </FormField>
            )}

            {/* Quote */}
            {isEditorRole ? (
                <FormField label={t('fieldQuote')} icon="lock">
                    <input type="text" value={`„${quote || '—'}"`} disabled className="field-input italic opacity-70 bg-muted/20 cursor-not-allowed" />
                </FormField>
            ) : (
                <FormField label={t('fieldQuote')} icon={isEditing ? 'edit' : undefined}>
                    <input id="field-quote" type="text" value={quote} onChange={(e) => setQuote(e.target.value)} placeholder={t('placeholderQuote')} className="field-input italic" />
                </FormField>
            )}

            {/* Country — nur Owner */}
            {isOwnerRole ? (
                <FormField label={t('fieldCountry')} icon={isEditing ? 'edit' : undefined}>
                    <input id="field-country" type="text" value={country} onChange={(e) => setCountry(e.target.value)} placeholder={t('placeholderCountry')} className="field-input" />
                </FormField>
            ) : isEditorRole && country ? (
                <FormField label={t('fieldCountry')} icon="lock">
                    <input type="text" value={country} disabled className="field-input opacity-70 bg-muted/20 cursor-not-allowed" />
                </FormField>
            ) : null}
        </section>
    );
}
