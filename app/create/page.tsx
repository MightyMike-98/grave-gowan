/**
 * @file app/create/page.tsx
 * @description Das mehrteilige Formular zum Erstellen oder Bearbeiten einer Gedenkseite.
 *
 * Das Formular besteht aus drei Abschnitten:
 * 1. **Core Information**: Name, Lebensdaten, Biographietext
 * 2. **Donations & Support**: Spendenorganisation (mit Schnellauswahl-Dropdown), URL und Beschreibung
 * 3. **Life Timeline**: Dynamisches Hinzufügen und Entfernen von Lebensereignissen
 *
 * Der URL-Parameter `?edit=true` schaltet die Seite in den Bearbeitungsmodus.
 * Das Formular simuliert beim Absenden einen API-Aufruf (1,5 Sek. Verzögerung).
 *
 * Die Seite nutzt `Suspense` als Wrapper, weil `useSearchParams()` es erfordert.
 * Benötigt 'use client', da useState, useRouter und useSearchParams genutzt werden.
 */

'use client';

import { ImageUploader } from '@/components/ui/ImageUploader';
import { POPULAR_CHARITIES } from '@/lib/mock-data';
import { createMemorial } from '@core/use-cases/createMemorial';
import { createSupabaseBrowserClient } from '@data/browser-client';
import { SupabaseMemorialRepository } from '@data/repositories/SupabaseMemorialRepository';
import { uploadMemorialImage } from '@data/storage';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

/**
 * Temporäres Datenformat für ein noch nicht gespeichertes Timeline-Ereignis.
 * Wird im Formular-State gehalten, bevor das Memorial erstellt wird.
 */
interface TimelineEventDraft {
    year: string;
    title: string;
    description: string;
}

/**
 * Das eigentliche Formular. Ausgelagert in eine eigene Funktion, damit
 * der `Suspense`-Wrapper in `CreatePage` es wrappen kann (Pflicht bei `useSearchParams`).
 */
function CreateMemorialForm() {
    const router = useRouter();
    const params = useSearchParams();
    const editId = params.get('id');            // Memorial-ID zum Editieren
    const visitorEmail = params.get('visitor_email');  // Gastbesucher-E-Mail (kein Login nötig)
    const isEditing = !!editId;

    // Core fields
    const [name, setName] = useState('');
    const [dateOfBirth, setDateOfBirth] = useState('');
    const [dateOfDeath, setDateOfDeath] = useState('');
    const [bio, setBio] = useState('');

    // Portrait-Bild (URL nach Supabase Storage Upload)
    const [portraitUrl, setPortraitUrl] = useState('');

    // Eingeloggter User (für Storage-Pfad)
    const [userId, setUserId] = useState<string | null>(null);

    // Bestehender Slug (für Weiterleitung nach Update)
    const [existingSlug, setExistingSlug] = useState('');

    // Support
    const [supportTitle, setSupportTitle] = useState('');
    const [supportUrl, setSupportUrl] = useState('');
    const [supportDesc, setSupportDesc] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);

    // Timeline
    const [timelineEvents, setTimelineEvents] = useState<TimelineEventDraft[]>([]);
    const [tempYear, setTempYear] = useState('');
    const [tempTitle, setTempTitle] = useState('');
    const [tempDesc, setTempDesc] = useState('');

    // Team Access (optionale Einladungen — werden nach Erstellen versendet)
    interface InviteDraft { email: string; role: 'editor' | 'viewer' }
    const [invites, setInvites] = useState<InviteDraft[]>([]);
    const [tempEmail, setTempEmail] = useState('');
    const [tempRole, setTempRole] = useState<'editor' | 'viewer'>('viewer');

    // Delete (nur im Edit-Modus)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteConfirmName, setDeleteConfirmName] = useState('');

    // Memorial ID anzeigen/verbergen
    const [showMemorialId, setShowMemorialId] = useState(false);
    const [deleting, setDeleting] = useState(false);

    // Rolle des aktuellen Users für dieses Memorial (null = noch nicht geladen)
    const [userRole, setUserRole] = useState<'owner' | 'editor' | 'viewer' | null>(null);
    const isOwnerRole = userRole === 'owner' || userRole === null; // null = neu erstellt → wie Owner behandeln

    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<string[]>([]);

    /**
     * Hilfsfunktion: Memorial-Felder aus DB-Row in State übernehmen.
     */
    const applyMemorialData = (data: Record<string, unknown>) => {
        setName((data.name as string) ?? '');
        setDateOfBirth((data.date_of_birth as string) ?? '');
        setDateOfDeath((data.date_of_death as string) ?? '');
        setBio((data.bio as string) ?? '');
        setPortraitUrl((data.portrait_url as string) ?? '');
        setExistingSlug((data.slug as string) ?? '');
        setSupportTitle((data.support_title as string) ?? '');
        setSupportUrl((data.support_url as string) ?? '');
        setSupportDesc((data.support_desc as string) ?? '');
        const tl = data.timeline;
        if (Array.isArray(tl)) {
            setTimelineEvents(
                tl.map((e: { year: string; title: string; description: string }) => ({
                    year: e.year ?? '',
                    title: e.title ?? '',
                    description: e.description ?? '',
                }))
            );
        }
    };

    /**
     * Lädt User-Session und ggf. bestehende Memorial-Daten zum Vorausfüllen.
     */
    useEffect(() => {
        const supabase = createSupabaseBrowserClient();

        // 1. User-ID laden (ist null bei Guest-Editoren)
        supabase.auth.getUser().then(({ data }) => {
            setUserId(data.user?.id ?? null);
        });

        // 2. Memorial-Daten laden wenn Edit-Modus
        if (editId) {
            if (visitorEmail) {
                // Guest-Editor: Daten via RPC laden (umgeht RLS, prüft Editor-E-Mail)
                supabase.rpc('get_memorial_for_editor', {
                    p_email: visitorEmail.toLowerCase(),
                    p_memorial_id: editId,
                }).then(({ data }) => {
                    if (data) applyMemorialData(data as Record<string, unknown>);
                });
                setUserRole('editor');
            } else {
                // Eingeloggter User: Daten direkt aus DB laden
                supabase
                    .from('memorials')
                    .select('*')
                    .eq('id', editId)
                    .single()
                    .then(({ data }) => {
                        if (data) applyMemorialData(data as Record<string, unknown>);
                    });

                // Rolle des Users für dieses Memorial laden
                supabase.auth.getUser().then(async ({ data: { user } }) => {
                    if (!user) return;
                    const { data: member } = await supabase
                        .from('memorial_members')
                        .select('role')
                        .eq('memorial_id', editId)
                        .eq('user_id', user.id)
                        .maybeSingle();
                    if (member) setUserRole(member.role as 'owner' | 'editor' | 'viewer');
                });
            }
        }
    }, [editId, visitorEmail]);

    /**
     * Fügt das aktuell in den Temp-Feldern eingetragene Ereignis zur Timeline-Liste hinzu
     * und leert danach die Eingabefelder für das nächste Ereignis.
     */
    const addTimelineEvent = () => {
        if (!tempYear || !tempTitle) {
            alert('Please enter at least a Year and Title.');
            return;
        }
        setTimelineEvents((prev) => [...prev, { year: tempYear, title: tempTitle, description: tempDesc }]);
        setTempYear('');
        setTempTitle('');
        setTempDesc('');
    };

    /**
     * Entfernt das Timeline-Ereignis an der gegebenen Position aus der Liste.
     * @param index - Index des zu entfernenden Ereignisses im Array.
     */
    const removeTimelineEvent = (index: number) => {
        setTimelineEvents((prev) => prev.filter((_, i) => i !== index));
    };

    /**
     * Speichert (Create oder Update) das Memorial in Supabase.
     * Nach dem Erstellen werden ausstehende Einladungen via API versendet.
     */
    const handleSubmit = async () => {
        const fieldErrors: string[] = [];
        if (!bio.trim()) fieldErrors.push('Biography is required.');
        if (!visitorEmail && !name.trim()) fieldErrors.push('Full Name is required.');
        if (!visitorEmail && !userId) fieldErrors.push('You must be logged in.');
        if (fieldErrors.length > 0) { setErrors(fieldErrors); return; }

        setErrors([]);
        setLoading(true);
        try {
            const repo = new SupabaseMemorialRepository();

            if (isEditing && editId) {
                if (visitorEmail) {
                    // Gastbesucher (Editor): RPC-Funktion nutzen (umgeht RLS, prüft per E-Mail)
                    const supabase = createSupabaseBrowserClient();
                    const { data: success, error: rpcErr } = await supabase.rpc('editor_update_memorial', {
                        p_email: visitorEmail.toLowerCase(),
                        p_memorial_id: editId,
                        p_bio: null,
                        p_date_of_birth: null,
                        p_date_of_death: dateOfDeath || null,
                        p_quote: null,   // quote field not yet in create form
                        p_timeline: timelineEvents.length > 0 ? timelineEvents : null,
                        p_support_title: supportTitle || null,
                        p_support_url: supportUrl || null,
                        p_support_desc: supportDesc || null,
                    });
                    if (rpcErr || !success) throw new Error(rpcErr?.message ?? 'Could not save. Check your permissions.');
                    router.push(`/memorial/${existingSlug}?visitor_email=${encodeURIComponent(visitorEmail)}`);
                } else if (isEditorRole) {
                    // Eingeloggter Editor: RPC-Funktion nutzen (wie Guest-Editor, nur erlaubte Felder)
                    const supabase = createSupabaseBrowserClient();
                    const { data: { user: authUser } } = await supabase.auth.getUser();
                    const editorEmail = authUser?.email;
                    if (!editorEmail) throw new Error('Could not determine your email. Please try again.');

                    const { data: success, error: rpcErr } = await supabase.rpc('editor_update_memorial', {
                        p_email: editorEmail.toLowerCase(),
                        p_memorial_id: editId,
                        p_bio: null,
                        p_date_of_birth: null,
                        p_date_of_death: dateOfDeath || null,
                        p_quote: null,
                        p_timeline: timelineEvents.length > 0 ? timelineEvents : null,
                        p_support_title: supportTitle || null,
                        p_support_url: supportUrl || null,
                        p_support_desc: supportDesc || null,
                    });
                    if (rpcErr || !success) throw new Error(rpcErr?.message ?? 'Could not save. Check your permissions.');
                    router.push(`/memorial/${existingSlug}`);
                } else {
                    // Eingeloggter Owner: Standard-Update via Repo (alle Felder erlaubt)
                    await repo.update(editId, {
                        name: name.trim(),
                        bio: bio.trim(),
                        dateOfBirth: dateOfBirth || undefined,
                        dateOfDeath: dateOfDeath || undefined,
                        portraitUrl: portraitUrl || undefined,
                        timeline: timelineEvents.length > 0 ? timelineEvents : [],
                        supportTitle: supportTitle || undefined,
                        supportUrl: supportUrl || undefined,
                        supportDesc: supportDesc || undefined,
                    });
                    router.push(`/memorial/${existingSlug}`);
                }
            } else {
                // CREATE: Neues Memorial erstellen
                const memorial = await createMemorial(
                    {
                        name: name.trim(),
                        bio: bio.trim(),
                        dateOfBirth: dateOfBirth || undefined,
                        dateOfDeath: dateOfDeath || undefined,
                        portraitUrl: portraitUrl || undefined,
                        ownerId: userId!,
                        slug: '',
                        theme: 'classic',
                        isPublic: false,
                        timeline: timelineEvents.length > 0 ? timelineEvents : undefined,
                        supportTitle: supportTitle || undefined,
                        supportUrl: supportUrl || undefined,
                        supportDesc: supportDesc || undefined,
                    },
                    repo,
                );

                // Owner in memorial_members eintragen (ersetzt den DB-Trigger, der RLS nicht bypassen kann)
                const supabase = createSupabaseBrowserClient();
                await supabase.from('memorial_members').insert({
                    memorial_id: memorial.id,
                    user_id: userId!,
                    role: 'owner',
                    invited_by: userId!,
                }).then(({ error }) => {
                    // Fehler loggen aber nicht den User blockieren (silently fail — Trigger könnte es auch gemacht haben)
                    if (error && !error.message.includes('duplicate') && !error.message.includes('unique')) {
                        console.warn('[Create] Could not insert owner into memorial_members:', error);
                    }
                });

                // Ausstehende Einladungen versenden (fire-and-forget)
                if (invites.length > 0) {
                    await Promise.allSettled(
                        invites.map((inv) =>
                            fetch('/api/members/invite', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    email: inv.email,
                                    role: inv.role,
                                    memorialId: memorial.id,
                                    invitedBy: userId,
                                    memorialSlug: memorial.slug,
                                }),
                            })
                        )
                    );
                }

                router.push(`/memorial/${memorial.slug}`);

            }
        } catch (err) {
            const msg = err instanceof Error ? err.message : '';
            const isDuplicate = msg.includes('duplicate') || msg.includes('unique') || msg.includes('slug');
            setErrors([isDuplicate
                ? 'A memorial with this name already exists. Try a slightly different name.'
                : (msg || 'Could not save. Please try again.')
            ]);
            setLoading(false);
        }
    };

    const isEditorRole = userRole === 'editor';

    /** Formatiert ein ISO-Datum (YYYY-MM-DD) als DD.MM.YYYY */
    const formatDate = (iso: string) => {
        if (!iso) return '—';
        const parts = iso.split('-');
        if (parts.length !== 3) return iso;
        return `${parts[2]}.${parts[1]}.${parts[0]}`;
    };

    return (
        <main className="min-h-screen bg-stone-100">
            {/* Portrait-Bereich */}
            <div className="max-w-lg mx-auto px-6 pt-8 flex justify-center">
                {isOwnerRole ? (
                    <ImageUploader
                        label="Portrait Photo"
                        currentUrl={portraitUrl}
                        onUpload={async (file: File) => {
                            if (!userId) throw new Error('Not logged in.');
                            const { url, error } = await uploadMemorialImage(file, userId, 'portrait');
                            if (error) throw new Error(error);
                            if (url) setPortraitUrl(url);
                        }}
                    />
                ) : portraitUrl ? (
                    <div className="relative">
                        <p className="text-xs text-stone-400 uppercase tracking-wide text-center mb-2 flex items-center justify-center gap-1.5">
                            <span className="text-stone-300">🔒</span> Portrait Photo
                        </p>
                        <div className="w-28 h-28 rounded-full overflow-hidden border-2 border-stone-200 shadow-sm opacity-80">
                            <img src={portraitUrl} alt="Portrait" className="w-full h-full object-cover" />
                        </div>
                    </div>
                ) : null}
            </div>

            <div className="max-w-lg mx-auto px-6 pb-20 space-y-10">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-semibold text-stone-800">
                        {isEditing ? 'Edit Memorial' : 'Create Memorial'}
                    </h1>
                    <Link
                        href={visitorEmail && existingSlug
                            ? `/memorial/${existingSlug}?visitor_email=${encodeURIComponent(visitorEmail)}`
                            : '/dashboard'
                        }
                        className="text-stone-400 text-sm hover:text-stone-600"
                    >
                        ← Back
                    </Link>
                </div>

                {/* Errors */}
                {errors.length > 0 && (
                    <div role="alert" className="bg-red-50 border border-red-100 rounded-lg p-4 space-y-1">
                        {errors.map((err, i) => (
                            <p key={i} className="text-sm text-red-600">{err}</p>
                        ))}
                    </div>
                )}

                {/* Core Info */}
                <section className="space-y-5">
                    <h2 className="text-xl font-semibold text-stone-800">Core Information</h2>

                    {/* Name: Owner kann editieren, Editor sieht es read-only */}
                    {isOwnerRole ? (
                        <FormField label="Full Name" icon="edit">
                            <input
                                id="field-name"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g., Sarah Jenkins"
                                className="field-input"
                            />
                        </FormField>
                    ) : isEditorRole && name ? (
                        <FormField label="Full Name" icon="lock">
                            <div className="field-locked">{name}</div>
                        </FormField>
                    ) : null}

                    {/* Date of Birth: Editor sieht es read-only */}
                    {isEditorRole ? (
                        <FormField label="Date of Birth" icon="lock">
                            <div className="field-locked">{formatDate(dateOfBirth)}</div>
                        </FormField>
                    ) : (
                        <FormField label="Date of Birth" icon={isEditing ? 'edit' : undefined}>
                            <input
                                id="field-dob"
                                type="date"
                                value={dateOfBirth}
                                onChange={(e) => setDateOfBirth(e.target.value)}
                                className="field-input"
                            />
                        </FormField>
                    )}

                    {/* Date of Death: Editor kann editieren */}
                    <FormField label="Date of Death" icon={isEditing ? 'edit' : undefined}>
                        <input
                            id="field-dod"
                            type="date"
                            value={dateOfDeath}
                            onChange={(e) => setDateOfDeath(e.target.value)}
                            className="field-input"
                        />
                    </FormField>

                    {/* Biography: Editor sieht es read-only */}
                    {isEditorRole ? (
                        <FormField label="Biography" icon="lock">
                            <div className="field-locked whitespace-pre-wrap">{bio || '—'}</div>
                        </FormField>
                    ) : (
                        <FormField label="Biography" icon={isEditing ? 'edit' : undefined}>
                            <textarea
                                id="field-bio"
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                placeholder="Share a brief memory..."
                                rows={4}
                                className="field-input resize-none"
                            />
                        </FormField>
                    )}
                </section>

                {/* Support */}
                <section className="border-t border-stone-200 pt-8 space-y-5">
                    <h2 className="text-xl font-semibold text-stone-800">Donations & Support <span className="text-stone-400 font-normal text-base">(Optional)</span></h2>

                    {/* Cause Title + Dropdown in einer Zeile */}
                    <FormField label="Cause Title">
                        <div className="relative">
                            <input
                                id="field-support-title"
                                type="text"
                                value={supportTitle}
                                onChange={(e) => setSupportTitle(e.target.value)}
                                placeholder="e.g., Cancer Research"
                                className="field-input pr-12"
                            />
                            <button
                                type="button"
                                onClick={() => setShowDropdown(!showDropdown)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 px-2 py-1 text-sm transition-colors"
                                title="Popular causes"
                            >
                                {showDropdown ? '▲' : '▼'}
                            </button>
                            {showDropdown && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-stone-200 rounded-lg overflow-hidden z-20 shadow-lg">
                                    {POPULAR_CHARITIES.map((charity, i) => (
                                        <button
                                            key={i}
                                            type="button"
                                            onClick={() => {
                                                setSupportTitle(charity.title);
                                                setSupportUrl(charity.url);
                                                setShowDropdown(false);
                                            }}
                                            className="w-full text-left px-4 py-3 text-stone-700 hover:bg-stone-50 border-b border-stone-100 last:border-0 transition-colors"
                                        >
                                            {charity.title}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </FormField>

                    <FormField label="Donation URL">
                        <input
                            id="field-support-url"
                            type="url"
                            value={supportUrl}
                            onChange={(e) => setSupportUrl(e.target.value)}
                            placeholder="https://..."
                            className="field-input"
                        />
                    </FormField>

                    <FormField label="Short Description">
                        <textarea
                            id="field-support-desc"
                            value={supportDesc}
                            onChange={(e) => setSupportDesc(e.target.value)}
                            placeholder="Why is this cause important?"
                            rows={2}
                            className="field-input resize-none"
                        />
                    </FormField>
                </section>

                {/* Timeline */}
                <section className="border-t border-stone-200 pt-8 space-y-5">
                    <h2 className="text-xl font-semibold text-stone-800">Life Timeline</h2>

                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <label htmlFor="tl-year" className="block text-xs text-stone-500 mb-1 uppercase tracking-wide">Year</label>
                            <input
                                id="tl-year"
                                type="text"
                                value={tempYear}
                                onChange={(e) => setTempYear(e.target.value)}
                                placeholder="1980"
                                className="field-input"
                            />
                        </div>
                        <div className="col-span-2">
                            <label htmlFor="tl-title" className="block text-xs text-stone-500 mb-1 uppercase tracking-wide">Title</label>
                            <input
                                id="tl-title"
                                type="text"
                                value={tempTitle}
                                onChange={(e) => setTempTitle(e.target.value)}
                                placeholder="Graduated"
                                className="field-input"
                            />
                        </div>
                    </div>

                    <FormField label="Description (Optional)">
                        <input
                            id="tl-desc"
                            type="text"
                            value={tempDesc}
                            onChange={(e) => setTempDesc(e.target.value)}
                            placeholder="Details..."
                            className="field-input"
                        />
                    </FormField>

                    <button
                        type="button"
                        onClick={addTimelineEvent}
                        className="bg-stone-100 border border-stone-200 text-stone-600 font-semibold text-sm px-4 py-2 rounded-lg hover:bg-stone-200 transition-colors"
                    >
                        + Add Event
                    </button>

                    {timelineEvents.length > 0 && (
                        <ol className="space-y-3">
                            {timelineEvents.map((event, i) => (
                                <li
                                    key={i}
                                    className="flex items-center justify-between bg-white border-l-4 border-stone-800 rounded-r-lg px-4 py-3 shadow-sm"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="font-bold text-stone-800">{event.year}</span>
                                        <span className="text-stone-600">{event.title}</span>
                                        {event.description && (
                                            <span className="text-xs text-stone-400 hidden sm:block">{event.description}</span>
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeTimelineEvent(i)}
                                        aria-label={`Remove ${event.title}`}
                                        className="text-red-400 hover:text-red-600 text-lg leading-none"
                                    >
                                        ×
                                    </button>
                                </li>
                            ))}
                        </ol>
                    )}
                </section>

                {/* Team Access — nur für Owner */}
                {isOwnerRole && (
                    <section className="border-t border-stone-200 pt-8 space-y-5">
                        <div>
                            <h2 className="text-xl font-semibold text-stone-800">
                                Team Access <span className="text-stone-400 font-normal text-base">(Optional)</span>
                            </h2>
                            <p className="text-sm text-stone-400 mt-1">
                                Invite people by email to view or edit this memorial.
                            </p>
                        </div>

                        {/* Memorial ID — sichtbar im Edit-Modus, maskiert wie ein Passwort */}
                        {isEditing && editId && (
                            <div className="bg-stone-50 border border-stone-200 rounded-lg px-4 py-3">
                                <label className="block text-stone-500 text-xs font-medium uppercase tracking-wide mb-1.5">
                                    Memorial ID
                                </label>
                                <div className="flex items-center gap-2">
                                    <code className="text-sm text-stone-700 font-mono flex-1 break-all select-all">
                                        {showMemorialId ? editId : '••••••••-••••-••••-••••-••••••••••••'}
                                    </code>
                                    <button
                                        type="button"
                                        onClick={() => setShowMemorialId(!showMemorialId)}
                                        className="text-stone-400 hover:text-stone-700 text-sm px-2 py-1 rounded transition-colors shrink-0"
                                        title={showMemorialId ? 'Hide ID' : 'Show ID'}
                                    >
                                        {showMemorialId ? 'Hide' : 'Show'}
                                    </button>
                                </div>
                                <p className="text-xs text-stone-400 mt-1.5">
                                    Share this ID with invited members so they can visit the memorial.
                                </p>
                            </div>
                        )}

                        {isEditing && existingSlug ? (
                            <a
                                href={`/memorial/${existingSlug}/settings`}
                                className="flex items-center gap-2 bg-stone-100 border border-stone-200 text-stone-700 text-sm font-medium px-4 py-3 rounded-lg hover:bg-stone-200 transition-colors"
                            >
                                <span>⚙️</span>
                                <span>Manage Team &amp; Roles</span>
                                <span className="ml-auto text-stone-400">→</span>
                            </a>
                        ) : (
                            <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6 space-y-5">
                                <h3 className="text-sm font-bold text-stone-700 tracking-wide uppercase">
                                    INVITE SOMEONE
                                </h3>

                                {/* Email Field */}
                                <div className="space-y-2">
                                    <label htmlFor="invite-email" className="block text-stone-600 font-medium text-sm">
                                        Email address
                                    </label>
                                    <input
                                        id="invite-email"
                                        type="email"
                                        value={tempEmail}
                                        onChange={(e) => setTempEmail(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                if (!tempEmail.includes('@')) return;
                                                if (invites.find(i => i.email === tempEmail)) return;
                                                setInvites(prev => [...prev, { email: tempEmail, role: tempRole }]);
                                                setTempEmail('');
                                            }
                                        }}
                                        placeholder="user@example.com"
                                        className="w-full bg-white border border-stone-200 rounded-lg p-3 text-base text-stone-800 outline-none transition-shadow focus:ring-2 focus:ring-stone-400"
                                    />
                                </div>

                                {/* Role Field */}
                                <div className="space-y-2">
                                    <label htmlFor="invite-role" className="block text-stone-600 font-medium text-sm">
                                        Role
                                    </label>
                                    <select
                                        id="invite-role"
                                        value={tempRole}
                                        onChange={(e) => setTempRole(e.target.value as 'editor' | 'viewer')}
                                        className="w-full bg-white border border-stone-200 rounded-lg p-3 text-base text-stone-800 outline-none transition-shadow focus:ring-2 focus:ring-stone-400"
                                    >
                                        <option value="viewer">👁 Viewer — can read the memorial</option>
                                        <option value="editor">✏️ Editor — can edit the memorial</option>
                                    </select>
                                </div>

                                {/* Submit Button */}
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (!tempEmail.includes('@')) return;
                                        if (invites.find(i => i.email === tempEmail)) return;
                                        setInvites(prev => [...prev, { email: tempEmail, role: tempRole }]);
                                        setTempEmail('');
                                    }}
                                    className="w-full bg-[#292524] text-white font-medium py-3 rounded-lg hover:bg-stone-900 transition-colors text-sm"
                                >
                                    Send Invite
                                </button>

                                {/* Pending Invites List */}
                                {invites.length > 0 && (
                                    <div className="pt-4 mt-2 border-t border-stone-100">
                                        <h4 className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-3">
                                            Pending Invites ({invites.length})
                                        </h4>
                                        <ul className="space-y-2">
                                            {invites.map((inv, i) => (
                                                <li key={i} className="flex items-center justify-between bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 shadow-sm">
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        <span className="text-stone-800 text-sm truncate">{inv.email}</span>
                                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium capitalize shrink-0 ${inv.role === 'editor' ? 'bg-blue-100 text-blue-700' : 'bg-stone-200 text-stone-600'}`}>
                                                            {inv.role}
                                                        </span>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => setInvites(prev => prev.filter((_, j) => j !== i))}
                                                        className="text-stone-400 hover:text-red-500 text-lg leading-none shrink-0 px-2"
                                                        title="Remove invite"
                                                    >
                                                        ×
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}
                    </section>
                )}

                {/* Submit */}
                <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={loading}
                    className="w-full bg-stone-800 text-stone-100 font-semibold text-sm uppercase tracking-widest py-5 rounded-full shadow-lg hover:bg-stone-900 disabled:opacity-50 transition-colors flex items-center justify-center"
                >
                    {loading ? (
                        <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                    ) : isEditing ? (
                        'Update Memorial'
                    ) : (
                        'Create Memorial'
                    )}
                </button>

                {/* Danger Zone — nur im Edit-Modus und nur für Owner */}
                {isEditing && editId && isOwnerRole && (
                    <section className="border-t border-red-200 pt-8 mt-4">
                        <div className="bg-red-50 border border-red-200 rounded-xl p-6 space-y-4">
                            <h3 className="text-red-700 font-semibold text-base">Danger Zone</h3>
                            <p className="text-red-600 text-sm">
                                This action is permanent and cannot be undone. All memories, photos, and team members will be deleted.
                            </p>

                            {!showDeleteConfirm ? (
                                <button
                                    type="button"
                                    onClick={() => setShowDeleteConfirm(true)}
                                    className="bg-white border border-red-300 text-red-600 font-semibold text-sm px-5 py-2.5 rounded-lg hover:bg-red-50 transition-colors"
                                >
                                    Delete this Memorial
                                </button>
                            ) : (
                                <div className="space-y-3">
                                    <p className="text-red-700 text-sm font-medium">
                                        Type <strong>&quot;{name}&quot;</strong> to confirm:
                                    </p>
                                    <input
                                        type="text"
                                        value={deleteConfirmName}
                                        onChange={(e) => setDeleteConfirmName(e.target.value)}
                                        placeholder={name}
                                        className="field-input border-red-300 focus:ring-red-400"
                                    />
                                    <div className="flex gap-3">
                                        <button
                                            type="button"
                                            disabled={deleteConfirmName !== name || deleting}
                                            onClick={async () => {
                                                setDeleting(true);
                                                try {
                                                    const repo = new SupabaseMemorialRepository();
                                                    await repo.delete(editId);
                                                    router.push('/dashboard');
                                                } catch (err) {
                                                    setErrors([err instanceof Error ? err.message : 'Could not delete.']);
                                                    setDeleting(false);
                                                }
                                            }}
                                            className="bg-red-600 text-white font-semibold text-sm px-5 py-2.5 rounded-lg hover:bg-red-700 disabled:opacity-40 transition-colors flex items-center gap-2"
                                        >
                                            {deleting ? (
                                                <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                                            ) : (
                                                'Permanently Delete'
                                            )}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmName(''); }}
                                            className="bg-white border border-stone-200 text-stone-600 text-sm px-4 py-2.5 rounded-lg hover:bg-stone-50 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>
                )}
            </div>

            <style jsx>{`
        .field-input {
          width: 100%;
          background: white;
          border: 1px solid #e7e5e4;
          border-radius: 0.5rem;
          padding: 1rem;
          font-size: 1rem;
          color: #292524;
          outline: none;
          transition: box-shadow 0.15s;
        }
        .field-input:focus {
          box-shadow: 0 0 0 2px #a8a29e;
        }
        .field-locked {
          width: 100%;
          background: #fafaf9;
          border: 1px solid #e7e5e4;
          border-radius: 0.5rem;
          padding: 1rem;
          font-size: 1rem;
          color: #78716c;
          cursor: not-allowed;
        }
      `}</style>
        </main>
    );
}

/**
 * Kleiner Layout-Helfer, der ein Label über einem Eingabefeld anzeigt.
 * Unterstützt optionale Icons: 'lock' (gesperrt) oder 'edit' (editierbar).
 *
 * @param label - Der Beschriftungstext, der über dem Eingabefeld erscheint.
 * @param icon  - Optionales Icon: 'lock' zeigt ein Schloss, 'edit' zeigt einen Stift.
 * @param children - Das eigentliche Eingabeelement (input, textarea, etc.).
 */
function FormField({ label, icon, children }: { label: string; icon?: 'lock' | 'edit'; children: React.ReactNode }) {
    return (
        <div className="space-y-2">
            <label className="flex items-center gap-1.5 text-stone-600 font-medium text-sm">
                {label}
                {icon === 'lock' && (
                    <span className="text-stone-300 text-xs" title="Only the owner can edit this field">🔒</span>
                )}
                {icon === 'edit' && (
                    <span className="text-stone-400 text-xs" title="You can edit this field">✏️</span>
                )}
            </label>
            {children}
        </div>
    );
}

/**
 * Seiten-Einstiegspunkt. Wrапpt die Formularkomponente in `Suspense`,
 * weil `useSearchParams()` (für den Edit-Modus) es zwingend erfordert.
 */
export default function CreatePage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-stone-100 flex items-center justify-center"><span className="text-stone-400">Loading...</span></div>}>
            <CreateMemorialForm />
        </Suspense>
    );
}
