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
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useRef, useState } from 'react';

const LONG_PRESS_MS = 700;

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
    const t = useTranslations('create');
    const router = useRouter();
    const params = useSearchParams();
    const editId = params.get('id');            // Memorial-ID zum Editieren
    const isEditing = !!editId;

    // Core fields
    const [name, setName] = useState('');
    const [dateOfBirth, setDateOfBirth] = useState('');
    const [dateOfDeath, setDateOfDeath] = useState('');
    const [bio, setBio] = useState('');
    const [quote, setQuote] = useState('');

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

    // --- Gallery, Stories, Highlights State ---
    const [galleryPhotos, setGalleryPhotos] = useState<{ id: string; url: string; favorite: boolean }[]>([]);
    const [galleryUploading, setGalleryUploading] = useState(false);
    const [stories, setStories] = useState<{ id: string; author: string; text: string; date: string; favorite: boolean }[]>([]);
    const [pendingStories, setPendingStories] = useState<{ id: string; author: string; text: string; date: string }[]>([]);
    const [storyAuthor, setStoryAuthor] = useState('');
    const [storyText, setStoryText] = useState('');
    const [moderationEnabled, setModerationEnabled] = useState(false);

    // -----------------------------------------------

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

    // Long-press to delete (with confirmation)
    const [pressingPhotoId, setPressingPhotoId] = useState<string | null>(null);
    const [pressingStoryId, setPressingStoryId] = useState<string | null>(null);
    const [confirmDeletePhotoId, setConfirmDeletePhotoId] = useState<string | null>(null);
    const [confirmDeleteStoryId, setConfirmDeleteStoryId] = useState<string | null>(null);
    const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const startPhotoPress = useCallback((photoId: string) => {
        if (confirmDeletePhotoId || confirmDeleteStoryId) return;
        setPressingPhotoId(photoId);
        pressTimer.current = setTimeout(() => {
            setPressingPhotoId(null);
            setConfirmDeletePhotoId(photoId);
        }, LONG_PRESS_MS);
    }, [confirmDeletePhotoId, confirmDeleteStoryId]);

    const startStoryPress = useCallback((storyId: string) => {
        if (confirmDeletePhotoId || confirmDeleteStoryId) return;
        setPressingStoryId(storyId);
        pressTimer.current = setTimeout(() => {
            setPressingStoryId(null);
            setConfirmDeleteStoryId(storyId);
        }, LONG_PRESS_MS);
    }, [confirmDeletePhotoId, confirmDeleteStoryId]);

    const cancelPress = useCallback(() => {
        if (pressTimer.current) clearTimeout(pressTimer.current);
        pressTimer.current = null;
        setPressingPhotoId(null);
        setPressingStoryId(null);
    }, []);

    const confirmPhotoDelete = useCallback((photoId: string) => {
        setConfirmDeletePhotoId(null);
        if (!photoId.startsWith('temp_')) {
            fetch(`/api/photos/${photoId}/delete`, { method: 'POST' });
        }
        setGalleryPhotos(prev => prev.filter(p => p.id !== photoId));
    }, []);

    const confirmStoryDelete = useCallback((storyId: string) => {
        setConfirmDeleteStoryId(null);
        handleDeleteStory(storyId);
    }, []);

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
        setQuote((data.quote as string) ?? '');
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
            {
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

            // 3. Galerie-Fotos aus DB laden
            supabase
                .from('gallery_photos')
                .select('*')
                .eq('memorial_id', editId)
                .order('sort_order', { ascending: true })
                .order('created_at', { ascending: false })
                .then(({ data: photos }) => {
                    if (photos) {
                        setGalleryPhotos(photos.map((p: { id: string; url: string; is_favorite: boolean }) => ({
                            id: p.id,
                            url: p.url,
                            favorite: p.is_favorite ?? false,
                        })));
                    }
                });

            // 4. Approved Stories laden
            supabase
                .from('memorial_stories')
                .select('*')
                .eq('memorial_id', editId)
                .eq('status', 'approved')
                .order('created_at', { ascending: false })
                .then(({ data: dbStories }) => {
                    if (dbStories) {
                        setStories(dbStories.map((s: { id: string; author: string; text: string; is_favorite: boolean; created_at: string }) => ({
                            id: s.id,
                            author: s.author,
                            text: s.text,
                            date: new Date(s.created_at).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }),
                            favorite: s.is_favorite ?? false,
                        })));
                    }
                });

            // 5. Pending Stories laden (Warteschlange)
            supabase
                .from('memorial_stories')
                .select('*')
                .eq('memorial_id', editId)
                .eq('status', 'pending')
                .order('created_at', { ascending: false })
                .then(({ data: dbPending }) => {
                    if (dbPending) {
                        setPendingStories(dbPending.map((s: { id: string; author: string; text: string; created_at: string }) => ({
                            id: s.id,
                            author: s.author,
                            text: s.text,
                            date: new Date(s.created_at).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }),
                        })));
                    }
                });
        }
    }, [editId]);

    /**
     * Lädt ein neues Galerie-Foto hoch und fügt es zum State hinzu.
     * Im Edit-Modus: direkt in DB speichern.
     * Im Create-Modus: nur in Storage hochladen, URL im State halten (wird beim Save in DB geschrieben).
     */
    const handleGalleryUpload = async (file: File) => {
        if (!userId) return;
        setGalleryUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            if (editId) formData.append('memorialId', editId);

            const res = await fetch('/api/photos/upload', { method: 'POST', body: formData });
            const data = await res.json();

            if (!res.ok) {
                console.error('[Create/Gallery] Upload error:', data.error);
                return;
            }

            if (editId && data.photo) {
                // Edit-Modus: foto hat echte DB-ID
                setGalleryPhotos(prev => [...prev, {
                    id: data.photo.id,
                    url: data.photo.url,
                    favorite: data.photo.isFavorite ?? false,
                }]);
            } else if (!editId && data.url) {
                // Create-Modus: staged mit temp-ID
                setGalleryPhotos(prev => [...prev, {
                    id: `temp_${Date.now()}`,
                    url: data.url,
                    favorite: false,
                }]);
            }
        } catch (err) {
            console.error('[Create/Gallery] Upload failed:', err);
        } finally {
            setGalleryUploading(false);
        }
    };

    /**
     * Schaltet den Favoriten-Status eines Galerie-Fotos um.
     * Staged Photos (temp_*) werden nur im State geändert, kein API-Call.
     */
    const handleToggleGalleryFavorite = async (photoId: string) => {
        setGalleryPhotos(prev => prev.map(p =>
            p.id === photoId ? { ...p, favorite: !p.favorite } : p
        ));
        if (photoId.startsWith('temp_')) return;
        try {
            const res = await fetch(`/api/photos/${photoId}/favorite`, { method: 'POST' });
            if (!res.ok) {
                setGalleryPhotos(prev => prev.map(p =>
                    p.id === photoId ? { ...p, favorite: !p.favorite } : p
                ));
            }
        } catch {
            setGalleryPhotos(prev => prev.map(p =>
                p.id === photoId ? { ...p, favorite: !p.favorite } : p
            ));
        }
    };

    /**
     * Fügt eine neue Story zum State hinzu.
     * Im Create-Modus: nur im State (wird beim Save in DB geschrieben).
     * Im Edit-Modus: direkt in DB speichern.
     */
    const handleAddStory = async () => {
        const author = storyAuthor.trim();
        const text = storyText.trim();
        if (!author || !text) return;

        const newStory = {
            id: `temp_${Date.now()}`,
            author,
            text,
            date: new Date().toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }),
            favorite: false,
        };

        if (editId) {
            const supabase = createSupabaseBrowserClient();
            const { data, error } = await supabase
                .from('memorial_stories')
                .insert({ memorial_id: editId, author, text, status: 'approved' })
                .select()
                .single();
            if (!error && data) {
                setStories(prev => [{ ...newStory, id: data.id }, ...prev]);
            }
        } else {
            setStories(prev => [newStory, ...prev]);
        }
        setStoryAuthor('');
        setStoryText('');
    };

    /** Genehmigt eine pending Story — setzt status auf 'approved' und verschiebt sie in die Story-Liste. */
    const handleApproveStory = async (storyId: string) => {
        const story = pendingStories.find(s => s.id === storyId);
        if (!story) return;
        const supabase = createSupabaseBrowserClient();
        const { error } = await supabase.from('memorial_stories').update({ status: 'approved' }).eq('id', storyId);
        if (!error) {
            setPendingStories(prev => prev.filter(s => s.id !== storyId));
            setStories(prev => [{ ...story, favorite: false }, ...prev]);
        }
    };

    /** Lehnt eine pending Story ab — löscht sie aus der DB. */
    const handleRejectStory = async (storyId: string) => {
        const supabase = createSupabaseBrowserClient();
        const { error } = await supabase.from('memorial_stories').delete().eq('id', storyId);
        if (!error) {
            setPendingStories(prev => prev.filter(s => s.id !== storyId));
        }
    };

    /** Toggelt den Favoriten-Status einer Story (edit mode: DB-Call, create mode: nur State). */
    const handleToggleStoryFavorite = async (storyId: string) => {
        const story = stories.find(s => s.id === storyId);
        if (!story) return;
        setStories(prev => prev.map(s => s.id === storyId ? { ...s, favorite: !s.favorite } : s));
        if (storyId.startsWith('temp_')) return;
        const supabase = createSupabaseBrowserClient();
        await supabase.from('memorial_stories').update({ is_favorite: !story.favorite }).eq('id', storyId);
    };

    /** Löscht eine Story (edit mode: DB-Call, create mode: nur State). */
    const handleDeleteStory = async (storyId: string) => {
        setStories(prev => prev.filter(s => s.id !== storyId));
        if (storyId.startsWith('temp_')) return;
        const supabase = createSupabaseBrowserClient();
        await supabase.from('memorial_stories').delete().eq('id', storyId);
    };

    /**
     * Fügt das aktuell in den Temp-Feldern eingetragene Ereignis zur Timeline-Liste hinzu
     * und leert danach die Eingabefelder für das nächste Ereignis.
     */
    const addTimelineEvent = () => {
        if (!tempYear || !tempTitle) {
            alert(t('errorYearTitle'));
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
        if (!bio.trim()) fieldErrors.push(t('errorBioRequired'));
        if (!name.trim()) fieldErrors.push(t('errorNameRequired'));
        if (!userId) fieldErrors.push(t('errorLoginRequired'));
        if (fieldErrors.length > 0) { setErrors(fieldErrors); return; }

        setErrors([]);
        setLoading(true);
        try {
            const repo = new SupabaseMemorialRepository();

            if (isEditing && editId) {
                if (isEditorRole) {
                    // Eingeloggter Editor: Update über Repo (eingeschränkte Felder)
                    await repo.update(editId, {
                        bio: bio.trim(),
                        quote: quote.trim() || undefined,
                        dateOfDeath: dateOfDeath || undefined,
                        timeline: timelineEvents.length > 0 ? timelineEvents : [],
                        supportTitle: supportTitle || undefined,
                        supportUrl: supportUrl || undefined,
                        supportDesc: supportDesc || undefined,
                    });
                    router.push(`/memorial/${existingSlug}`);
                } else {
                    // Owner: Standard-Update via Repo (alle Felder erlaubt)
                    await repo.update(editId, {
                        name: name.trim(),
                        bio: bio.trim(),
                        quote: quote.trim() || undefined,
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
                        quote: quote.trim() || undefined,
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

                // Staged Gallery-Fotos in DB schreiben
                if (galleryPhotos.length > 0) {
                    await Promise.allSettled(
                        galleryPhotos.map((photo) =>
                            supabase.from('gallery_photos').insert({
                                memorial_id: memorial.id,
                                uploaded_by: userId!,
                                url: photo.url,
                                is_favorite: photo.favorite,
                            })
                        )
                    );
                }

                // Staged Stories in DB schreiben
                if (stories.length > 0) {
                    await Promise.allSettled(
                        stories.map((story) =>
                            supabase.from('memorial_stories').insert({
                                memorial_id: memorial.id,
                                author: story.author,
                                text: story.text,
                                is_favorite: story.favorite,
                            })
                        )
                    );
                }

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
                ? t('errorNameExists')
                : (msg || t('errorSaveFailed'))
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
        <main className="min-h-screen px-4 py-10">
            {/* Portrait-Bereich */}
            <div className="max-w-xl mx-auto flex justify-center">
                {isOwnerRole ? (
                    <ImageUploader
                        label={t('sectionPortrait')}
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
                        <p className="text-xs font-light tracking-wider text-center mb-2 flex items-center justify-center gap-1.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
                            <span style={{ color: 'hsl(var(--muted-foreground) / 0.5)' }}>🔒</span> {t('sectionPortrait')}
                        </p>
                        <div className="w-28 h-28 rounded-full overflow-hidden shadow-sm opacity-80" style={{ border: '2px solid hsl(var(--border))' }}>
                            <img src={portraitUrl} alt="Portrait" className="w-full h-full object-cover" />
                        </div>
                    </div>
                ) : null}
            </div>

            <div className="mx-auto max-w-xl pb-20 space-y-10 mt-8">
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl tracking-tight">
                        {isEditing ? t('titleEdit') : t('titleCreate')}
                    </h1>
                    <Link
                        href="/dashboard"
                        className="text-sm font-light transition-colors hover:opacity-100"
                        style={{ color: 'hsl(var(--muted-foreground))' }}
                    >
                        ← Back
                    </Link>
                </div>

                {/* Errors */}
                {errors.length > 0 && (
                    <div role="alert" className="rounded-xl p-4 space-y-1" style={{ backgroundColor: 'hsl(var(--destructive) / 0.05)', border: '1px solid hsl(var(--destructive) / 0.2)' }}>
                        {errors.map((err, i) => (
                            <p key={i} className="text-sm" style={{ color: 'hsl(var(--destructive))' }}>{err}</p>
                        ))}
                    </div>
                )}

                {/* Core Info */}
                <section className="space-y-5">
                    <h2 className="text-xl tracking-tight">{t('sectionCoreInfo')}</h2>

                    {/* Name: Owner kann editieren, Editor sieht es read-only */}
                    {isOwnerRole ? (
                        <FormField label={t('fieldName')} icon="edit">
                            <input
                                id="field-name"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder={t('placeholderName')}
                                className="field-input"
                            />
                        </FormField>
                    ) : isEditorRole && name ? (
                        <FormField label={t('fieldName')} icon="lock">
                            <input type="text" value={name} disabled className="field-input opacity-70 bg-muted/20 cursor-not-allowed" />
                        </FormField>
                    ) : null}

                    {/* Date of Birth: Editor sieht es read-only */}
                    {isEditorRole ? (
                        <FormField label={t('fieldDob')} icon="lock">
                            <input type="text" value={formatDate(dateOfBirth)} disabled className="field-input opacity-70 bg-muted/20 cursor-not-allowed" />
                        </FormField>
                    ) : (
                        <FormField label={t('fieldDob')} icon={isEditing ? 'edit' : undefined}>
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
                    <FormField label={t('fieldDod')} icon={isEditing ? 'edit' : undefined}>
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
                        <FormField label={t('fieldBio')} icon="lock">
                            <textarea value={bio || '—'} disabled rows={5} className="field-input !h-auto min-h-[150px] resize-none opacity-70 bg-muted/20 cursor-not-allowed" />
                        </FormField>
                    ) : (
                        <FormField label={t('fieldBio')} icon={isEditing ? 'edit' : undefined}>
                            <textarea
                                id="field-bio"
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                placeholder={t('placeholderBio')}
                                rows={5}
                                className="field-input !h-auto min-h-[150px] resize-y"
                            />
                        </FormField>
                    )}

                    {/* Quote: Editor sieht es read-only */}
                    {isEditorRole ? (
                        <FormField label={t('fieldQuote')} icon="lock">
                            <input type="text" value={`„${quote || '—'}"`} disabled className="field-input italic opacity-70 bg-muted/20 cursor-not-allowed" />
                        </FormField>
                    ) : (
                        <FormField label={t('fieldQuote')} icon={isEditing ? 'edit' : undefined}>
                            <input
                                id="field-quote"
                                type="text"
                                value={quote}
                                onChange={(e) => setQuote(e.target.value)}
                                placeholder={t('placeholderQuote')}
                                className="field-input italic"
                            />
                        </FormField>
                    )}
                </section>

                {/* Support */}
                <section className="pt-12 space-y-5">
                    <div className="mb-8 h-px" style={{ backgroundColor: 'hsl(var(--border) / 0.4)' }} />
                    <h2 className="text-xl tracking-tight">{t('sectionDonations')} <span className="text-base font-light" style={{ color: 'hsl(var(--muted-foreground))' }}>{t('sectionOptional')}</span></h2>

                    {/* Cause Title + Dropdown in einer Zeile */}
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
                        <input
                            id="field-support-url"
                            type="url"
                            value={supportUrl}
                            onChange={(e) => setSupportUrl(e.target.value)}
                            placeholder={t('placeholderCauseUrl')}
                            className="field-input"
                        />
                    </FormField>

                    <FormField label={t('fieldCauseDesc')}>
                        <textarea
                            id="field-support-desc"
                            value={supportDesc}
                            onChange={(e) => setSupportDesc(e.target.value)}
                            placeholder={t('placeholderCauseDesc')}
                            rows={2}
                            className="field-input resize-none"
                        />
                    </FormField>
                </section>

                {/* Timeline */}
                <section className="pt-12 space-y-5">
                    <div className="mb-8 h-px" style={{ backgroundColor: 'hsl(var(--border) / 0.4)' }} />
                    <h2 className="text-xl tracking-tight">{t('sectionLifeTimeline')}</h2>

                    <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1">
                            <label htmlFor="tl-year" className="block text-[11px] font-medium uppercase tracking-[0.15em]" style={{ color: 'hsl(var(--muted-foreground))' }}>{t('fieldYear')}</label>
                            <input
                                id="tl-year"
                                type="text"
                                value={tempYear}
                                onChange={(e) => setTempYear(e.target.value)}
                                placeholder={t('placeholderYear')}
                                className="field-input"
                            />
                        </div>
                        <div className="col-span-2 space-y-1">
                            <label htmlFor="tl-title" className="block text-[11px] font-medium uppercase tracking-[0.15em]" style={{ color: 'hsl(var(--muted-foreground))' }}>{t('fieldTitle')}</label>
                            <input
                                id="tl-title"
                                type="text"
                                value={tempTitle}
                                onChange={(e) => setTempTitle(e.target.value)}
                                placeholder={t('placeholderEventTitle')}
                                className="field-input"
                            />
                        </div>
                    </div>

                    <FormField label={t('fieldDescOptional')}>
                        <input
                            id="tl-desc"
                            type="text"
                            value={tempDesc}
                            onChange={(e) => setTempDesc(e.target.value)}
                            placeholder={t('placeholderDetails')}
                            className="field-input"
                        />
                    </FormField>

                    <button
                        type="button"
                        onClick={addTimelineEvent}
                        className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-light shadow-sm transition-colors"
                        style={{ color: 'hsl(var(--foreground))', border: '1px solid hsl(var(--border) / 0.6)' }}
                    >
                        + Add Event
                    </button>

                    {timelineEvents.length > 0 && (
                        <div className="space-y-3">
                            {timelineEvents.map((event, i) => (
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
                                        onClick={() => removeTimelineEvent(i)}
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

                {/* ── GALLERY MANAGEMENT ── */}
                <section className="pt-12 space-y-5">
                    <div className="mb-8 h-px" style={{ backgroundColor: 'hsl(var(--border) / 0.4)' }} />
                    <style>{`@keyframes longpress-fill { from { opacity: 0; } to { opacity: 1; } }`}</style>
                    <h2 className="text-xl tracking-tight">{t('sectionGallery')}</h2>
                    <p className="text-sm font-light" style={{ color: 'hsl(var(--muted-foreground))' }}>
                        {t('galleryHint')}
                    </p>

                    <div className="grid grid-cols-3 gap-3">
                        {galleryPhotos.map((photo) => (
                            <div
                                key={photo.id}
                                className="group relative aspect-square rounded-lg overflow-hidden select-none"
                                style={{ backgroundColor: 'hsl(var(--muted) / 0.2)' }}
                                onPointerDown={() => startPhotoPress(photo.id)}
                                onPointerUp={cancelPress}
                                onPointerLeave={cancelPress}
                                onContextMenu={(e) => e.preventDefault()}
                            >
                                <img
                                    src={photo.url}
                                    alt=""
                                    className="h-full w-full object-cover"
                                    loading="lazy"
                                />
                                {/* Long-press progress overlay */}
                                {pressingPhotoId === photo.id && (
                                    <div
                                        className="absolute inset-0 z-20 pointer-events-none"
                                        style={{
                                            backgroundColor: 'hsl(var(--destructive) / 0.35)',
                                            animation: `longpress-fill ${LONG_PRESS_MS}ms ease-in forwards`,
                                        }}
                                    />
                                )}
                                {/* Delete confirmation overlay */}
                                {confirmDeletePhotoId === photo.id && (
                                    <div
                                        className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-2.5 backdrop-blur-md"
                                        style={{ backgroundColor: 'hsl(var(--background) / 0.85)' }}
                                        onPointerDown={(e) => e.stopPropagation()}
                                    >
                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2} style={{ color: 'hsl(var(--muted-foreground))' }}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                        </svg>
                                        <p className="text-[10px] font-light tracking-wide" style={{ color: 'hsl(var(--muted-foreground))' }}>{t('storyRemoveConfirm')}</p>
                                        <div className="flex flex-col gap-1 w-full px-3">
                                            <button
                                                type="button"
                                                onClick={() => confirmPhotoDelete(photo.id)}
                                                className="w-full rounded-full py-1 text-[10px] font-light tracking-wider transition-all"
                                                style={{ backgroundColor: 'hsl(var(--foreground))', color: 'hsl(var(--background))' }}
                                            >
                                                {t('storyRemove')}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setConfirmDeletePhotoId(null)}
                                                className="w-full rounded-full py-1 text-[10px] font-light tracking-wider transition-all"
                                                style={{ color: 'hsl(var(--muted-foreground))' }}
                                            >
                                                {t('storyCancel')}
                                            </button>
                                        </div>
                                    </div>
                                )}
                                {/* Favorite-Toggle */}
                                {!confirmDeletePhotoId && (
                                    <button
                                        type="button"
                                        onClick={() => handleToggleGalleryFavorite(photo.id)}
                                        onPointerDown={(e) => e.stopPropagation()}
                                        className="absolute top-1.5 right-1.5 z-10 rounded-full p-1 transition-colors hover:bg-foreground/10"
                                    >
                                        <svg className="h-3.5 w-3.5 transition-colors" fill={photo.favorite ? "hsl(45 93% 55%)" : "none"} viewBox="0 0 24 24" stroke={photo.favorite ? "hsl(45 93% 55%)" : "hsl(var(--primary-foreground) / 0.5)"} strokeWidth={1.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        ))}

                        {/* Upload-Button */}
                        <label
                            className="aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer hover:bg-foreground/5"
                            style={{ borderColor: 'hsl(var(--border) / 0.4)', backgroundColor: 'hsl(var(--muted) / 0.1)' }}
                        >
                            {galleryUploading ? (
                                <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" style={{ color: 'hsl(var(--muted-foreground) / 0.4)' }} />
                            ) : (
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} style={{ color: 'hsl(var(--muted-foreground) / 0.4)' }}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                </svg>
                            )}
                            <span className="text-[10px] font-light" style={{ color: 'hsl(var(--muted-foreground) / 0.5)' }}>
                                {galleryUploading ? t('loading') : t('addButton')}
                            </span>
                            <input
                                type="file"
                                accept="image/jpeg,image/png,image/webp,image/gif"
                                className="hidden"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleGalleryUpload(file);
                                    e.target.value = '';
                                }}
                            />
                        </label>
                    </div>
                </section>

                {/* ── STORIES MANAGEMENT ── */}
                <section className="pt-12 space-y-5">
                    <div className="mb-8 h-px" style={{ backgroundColor: 'hsl(var(--border) / 0.4)' }} />
                    <h2 className="text-xl tracking-tight">
                        {t('sectionStories')} <span className="text-base font-light" style={{ color: 'hsl(var(--muted-foreground))' }}>({t('storiesGuestbook')})</span>
                    </h2>
                    <p className="text-sm font-light" style={{ color: 'hsl(var(--muted-foreground))' }}>
                        {t('storiesDescription')}
                    </p>

                    {/* Warteschlange — Pending Stories */}
                    {pendingStories.length > 0 && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2.5">
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} style={{ color: 'hsl(var(--muted-foreground))' }}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <h3 className="text-base tracking-tight" style={{ color: 'hsl(var(--foreground))' }}>{t('queue')}</h3>
                                <span
                                    className="rounded-full px-2.5 py-0.5 text-[10px] font-medium"
                                    style={{ backgroundColor: 'hsl(var(--foreground) / 0.08)', color: 'hsl(var(--foreground))' }}
                                >
                                    {t('pendingCount', { count: pendingStories.length })}
                                </span>
                            </div>

                            {pendingStories.map(story => (
                                <div
                                    key={story.id}
                                    className="rounded-xl border p-5 space-y-4"
                                    style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border) / 0.4)' }}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2.5">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-full text-xs" style={{ backgroundColor: 'hsl(var(--muted) / 0.6)', color: 'hsl(var(--muted-foreground))' }}>
                                                {story.author.substring(0, 2).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>{story.author}</p>
                                                <p className="text-[11px] font-light" style={{ color: 'hsl(var(--muted-foreground))' }}>{story.date}</p>
                                            </div>
                                        </div>
                                        <span
                                            className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-normal"
                                            style={{ border: '1px solid hsl(var(--border) / 0.5)', color: 'hsl(var(--muted-foreground))' }}
                                        >
                                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            {t('pendingBadge')}
                                        </span>
                                    </div>
                                    <p className="text-sm font-light leading-relaxed" style={{ color: 'hsl(var(--foreground) / 0.75)' }}>
                                        {story.text}
                                    </p>
                                    <div className="flex gap-3">
                                        <button
                                            type="button"
                                            onClick={() => handleApproveStory(story.id)}
                                            className="flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-light tracking-wider transition-all"
                                            style={{ backgroundColor: 'hsl(var(--foreground))', color: 'hsl(var(--background))' }}
                                        >
                                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                            </svg>
                                            {t('approve')}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleRejectStory(story.id)}
                                            className="flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-light tracking-wider transition-all"
                                            style={{ color: 'hsl(var(--destructive))', border: '1px solid hsl(var(--destructive) / 0.3)', backgroundColor: 'hsl(var(--destructive) / 0.05)' }}
                                        >
                                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                            {t('reject')}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Add Story Form */}
                    <div className="rounded-xl p-5 space-y-3" style={{ backgroundColor: 'hsl(var(--muted) / 0.15)', border: '1px dashed hsl(var(--border) / 0.5)' }}>
                        <input
                            type="text"
                            value={storyAuthor}
                            onChange={(e) => setStoryAuthor(e.target.value)}
                            placeholder={t('placeholderAuthor')}
                            className="field-input"
                        />
                        <textarea
                            value={storyText}
                            onChange={(e) => setStoryText(e.target.value)}
                            placeholder={t('placeholderStory')}
                            rows={3}
                            className="field-input resize-none"
                        />
                        <button
                            type="button"
                            onClick={handleAddStory}
                            disabled={!storyAuthor.trim() || !storyText.trim()}
                            className="rounded-full px-5 py-2 text-xs font-light uppercase tracking-[0.15em] transition-colors disabled:opacity-40"
                            style={{ backgroundColor: 'hsl(var(--foreground) / 0.08)', color: 'hsl(var(--foreground) / 0.7)', border: '1px solid hsl(var(--border) / 0.4)' }}
                        >
                            {t('addStory')}
                        </button>
                    </div>

                    {/* Story List */}
                    <div className="space-y-4">
                        {stories.map(story => (
                            <div
                                key={story.id}
                                className="relative rounded-xl border p-5 shadow-sm space-y-4 select-none overflow-hidden"
                                style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border) / 0.4)' }}
                                onPointerDown={() => startStoryPress(story.id)}
                                onPointerUp={cancelPress}
                                onPointerLeave={cancelPress}
                                onContextMenu={(e) => e.preventDefault()}
                            >
                                {/* Long-press progress overlay */}
                                {pressingStoryId === story.id && (
                                    <div
                                        className="absolute inset-0 z-10 pointer-events-none rounded-xl"
                                        style={{
                                            backgroundColor: 'hsl(var(--destructive) / 0.15)',
                                            animation: `longpress-fill ${LONG_PRESS_MS}ms ease-in forwards`,
                                        }}
                                    />
                                )}
                                {/* Delete confirmation overlay */}
                                {confirmDeleteStoryId === story.id && (
                                    <div
                                        className="absolute inset-0 z-30 flex items-center justify-center gap-6 rounded-xl backdrop-blur-md"
                                        style={{ backgroundColor: 'hsl(var(--background) / 0.9)' }}
                                        onPointerDown={(e) => e.stopPropagation()}
                                    >
                                        <div className="flex flex-col items-center gap-3">
                                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2} style={{ color: 'hsl(var(--muted-foreground))' }}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                            </svg>
                                            <p className="text-sm font-light tracking-wide" style={{ color: 'hsl(var(--muted-foreground))' }}>
                                                {t('storyRemoveConfirm')}
                                            </p>
                                            <div className="flex gap-3 mt-1">
                                                <button
                                                    type="button"
                                                    onClick={() => confirmStoryDelete(story.id)}
                                                    className="rounded-full px-5 py-2 text-xs font-light tracking-wider transition-all"
                                                    style={{ backgroundColor: 'hsl(var(--foreground))', color: 'hsl(var(--background))' }}
                                                >
                                                    {t('storyRemove')}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setConfirmDeleteStoryId(null)}
                                                    className="rounded-full px-5 py-2 text-xs font-light tracking-wider transition-all"
                                                    style={{ color: 'hsl(var(--muted-foreground))', border: '1px solid hsl(var(--border) / 0.5)' }}
                                                >
                                                    {t('storyCancel')}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2.5">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full text-xs" style={{ backgroundColor: 'hsl(var(--muted) / 0.6)', color: 'hsl(var(--muted-foreground))' }}>
                                            {story.author.substring(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>{story.author}</p>
                                            <p className="text-[11px] font-light" style={{ color: 'hsl(var(--muted-foreground))' }}>{story.date}</p>
                                        </div>
                                    </div>
                                    {!confirmDeleteStoryId && (
                                        <button
                                            type="button"
                                            onClick={() => handleToggleStoryFavorite(story.id)}
                                            onPointerDown={(e) => e.stopPropagation()}
                                            className="relative z-20 rounded-full p-1 transition-colors hover:bg-foreground/10"
                                        >
                                            <svg className="h-3.5 w-3.5 transition-colors" fill={story.favorite ? "hsl(45 93% 55%)" : "none"} viewBox="0 0 24 24" stroke={story.favorite ? "hsl(45 93% 55%)" : "hsl(var(--muted-foreground) / 0.3)"} strokeWidth={1.5}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                                <p className="text-sm font-light leading-relaxed" style={{ color: 'hsl(var(--foreground) / 0.75)' }}>
                                    {story.text}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>


                {/* Team Access — nur für Owner */}
                {isOwnerRole && (
                    <section className="pt-8 space-y-5">
                        <div className="-mt-8 mb-5 h-px" style={{ backgroundColor: 'hsl(var(--border) / 0.4)' }} />
                        <div>
                            <h2 className="text-xl tracking-tight">
                                Team Access <span className="text-base font-light" style={{ color: 'hsl(var(--muted-foreground))' }}>(Optional)</span>
                            </h2>
                            <p className="text-sm font-light mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
                                Invite people by email to view or edit this memorial.
                            </p>
                        </div>

                        {/* Memorial ID — sichtbar im Edit-Modus, maskiert wie ein Passwort */}
                        {isEditing && editId && (
                            <div className="rounded-xl p-5 shadow-sm" style={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border) / 0.4)' }}>
                                <p className="text-[11px] font-medium uppercase tracking-[0.15em]" style={{ color: 'hsl(var(--muted-foreground))' }}>
                                    Memorial ID
                                </p>
                                <div className="mt-2 flex items-center justify-between">
                                    <span className="font-mono text-sm font-light">
                                        {showMemorialId ? editId : '••••••••-••••-••••-••••-••••••••••••'}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => setShowMemorialId(!showMemorialId)}
                                        className="transition-colors"
                                        style={{ color: 'hsl(var(--muted-foreground))' }}
                                        title={showMemorialId ? t('hideId') : t('showId')}
                                    >
                                        {showMemorialId ? '🔒' : '👁'}
                                    </button>
                                </div>
                                <p className="mt-2 text-xs font-light" style={{ color: 'hsl(var(--muted-foreground))' }}>
                                    Share this ID with invited members so they can visit the memorial.
                                </p>
                            </div>
                        )}

                        {isEditing && existingSlug ? (
                            <a
                                href={`/memorial/${existingSlug}/settings`}
                                className="flex w-full items-center justify-between rounded-xl p-4 text-left shadow-sm transition-colors"
                                style={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border) / 0.4)' }}
                            >
                                <div className="flex items-center gap-2.5">
                                    <span>⚙️</span>
                                    <span className="text-sm font-light">{t('manageTeam')}</span>
                                </div>
                                <span style={{ color: 'hsl(var(--muted-foreground) / 0.5)' }}>→</span>
                            </a>
                        ) : (
                            <div className="rounded-xl p-6 space-y-5 shadow-sm" style={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border) / 0.4)' }}>
                                <h3 className="text-[11px] font-medium uppercase tracking-[0.15em]" style={{ fontFamily: 'var(--font-inter)', color: 'hsl(var(--muted-foreground))' }}>
                                    INVITE SOMEONE
                                </h3>

                                {/* Email Field */}
                                <div className="space-y-2">
                                    <label htmlFor="invite-email" className="block text-sm font-light">
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
                                        placeholder={t('placeholderEmail')}
                                        className="field-input"
                                    />
                                </div>

                                {/* Role Field */}
                                <div className="space-y-2">
                                    <label htmlFor="invite-role" className="block text-sm font-light">
                                        Role
                                    </label>
                                    <select
                                        id="invite-role"
                                        value={tempRole}
                                        onChange={(e) => setTempRole(e.target.value as 'editor' | 'viewer')}
                                        className="field-input"
                                    >
                                        <option value="viewer">{t('roleViewer')}</option>
                                        <option value="editor">{t('roleEditor')}</option>
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
                                    className="w-full rounded-full py-3 text-xs font-normal uppercase tracking-[0.25em] shadow-sm transition-shadow duration-300 hover:shadow-md"
                                    style={{ backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
                                >
                                    Send Invite
                                </button>

                                {/* Pending Invites List */}
                                {invites.length > 0 && (
                                    <div className="pt-4 mt-2" style={{ borderTop: '1px solid hsl(var(--border) / 0.4)' }}>
                                        <h4 className="text-[11px] font-medium uppercase tracking-[0.15em] mb-3" style={{ color: 'hsl(var(--muted-foreground))' }}>
                                            Pending Invites ({invites.length})
                                        </h4>
                                        <ul className="space-y-2">
                                            {invites.map((inv, i) => (
                                                <li key={i} className="flex items-center justify-between rounded-lg px-3 py-2 shadow-sm" style={{ backgroundColor: 'hsl(var(--muted) / 0.3)', border: '1px solid hsl(var(--border) / 0.4)' }}>
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        <span className="text-sm font-light truncate">{inv.email}</span>
                                                        <span className="text-[10px] px-2 py-0.5 rounded-full font-normal capitalize shrink-0" style={{ backgroundColor: 'hsl(var(--secondary))', color: 'hsl(var(--secondary-foreground))' }}>
                                                            {inv.role}
                                                        </span>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => setInvites(prev => prev.filter((_, j) => j !== i))}
                                                        className="text-lg leading-none shrink-0 px-2 transition-colors"
                                                        style={{ color: 'hsl(var(--destructive) / 0.7)' }}
                                                        title={t('removeInvite')}
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
                    className="w-full rounded-full py-5 text-xs font-normal uppercase tracking-[0.25em] shadow-sm transition-shadow duration-300 hover:shadow-md disabled:opacity-50 flex items-center justify-center"
                    style={{ backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
                >
                    {loading ? (
                        <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                    ) : isEditing ? (
                        t('saveUpdate')
                    ) : (
                        t('saveCreate')
                    )}
                </button>

                {/* Danger Zone — nur im Edit-Modus und nur für Owner */}
                {isEditing && editId && isOwnerRole && (
                    <section className="pt-8 mt-4">
                        <div className="rounded-xl p-6 space-y-4" style={{ backgroundColor: 'hsl(var(--destructive) / 0.05)', border: '1px solid hsl(var(--destructive) / 0.2)' }}>
                            <h3 className="text-lg" style={{ fontFamily: 'var(--font-inter)', fontWeight: 600, color: 'hsl(var(--destructive))' }}>{t('dangerZone')}</h3>
                            <p className="text-sm font-light" style={{ color: 'hsl(var(--destructive) / 0.7)' }}>
                                This action is permanent and cannot be undone. All memories, photos, and team members will be deleted.
                            </p>

                            {!showDeleteConfirm ? (
                                <button
                                    type="button"
                                    onClick={() => setShowDeleteConfirm(true)}
                                    className="rounded-lg px-5 py-2.5 text-sm transition-colors"
                                    style={{ color: 'hsl(var(--destructive))', border: '1px solid hsl(var(--destructive) / 0.3)' }}
                                >
                                    Delete this Memorial
                                </button>
                            ) : (
                                <div className="space-y-3">
                                    <p className="text-red-700 text-sm font-medium">
                                        {t('deleteConfirmLabel', { name })}
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
                                            className="rounded-lg px-5 py-2.5 text-sm font-normal disabled:opacity-40 transition-colors flex items-center gap-2"
                                            style={{ backgroundColor: 'hsl(var(--destructive))', color: 'hsl(var(--destructive-foreground))' }}
                                        >
                                            {deleting ? (
                                                <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                                            ) : (
                                                t('deleteButton')
                                            )}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmName(''); }}
                                            className="rounded-lg text-sm px-4 py-2.5 transition-colors"
                                            style={{ color: 'hsl(var(--foreground))', border: '1px solid hsl(var(--border))' }}
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

            {/* field-input and field-locked styles are now in globals.css */}
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
            <label className="flex items-center gap-1.5 text-sm font-light">
                {label}
                {icon === 'lock' && (
                    <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground) / 0.5)' }} title="Only the owner can edit this field">🔒</span>
                )}
                {icon === 'edit' && (
                    <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }} title="You can edit this field">✏️</span>
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
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><span style={{ color: 'hsl(var(--muted-foreground))' }}>Loading...</span></div>}>
            <CreateMemorialForm />
        </Suspense>
    );
}
